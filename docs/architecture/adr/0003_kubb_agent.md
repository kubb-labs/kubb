# ADR-0003: Kubb Agent architecture and security model

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the long-running process that runs Kubb code generation on behalf of Kubb Studio. The agent runs locally or inside a Docker container on the operator's infrastructure. Studio runs as a hosted service at `https://studio.kubb.dev` or a self-hosted instance.

The agent is a WebSocket client, not a public HTTP server. On startup it registers with Studio, opens one or more WebSocket sessions, and waits for commands. The only inbound HTTP route the agent exposes is `GET /api/health` for container probes.

This shapes every decision below. AI assistants and CI pipelines that want to drive code generation go through Studio. Studio fans the work out to a connected agent.

Three problems pushed this ADR:

1. The v4 `JSONKubbConfig` partially typed plugin options, coupling the agent binary to first-party plugin versions and excluding community packages.
2. There is no written record of where the trust boundary sits, even though the agent runs user-controlled code (plugins) on behalf of a remote orchestrator (Studio).
3. The machine binding, sandbox isolation, and permissions model that already exist in code are not captured in any architecture document, so contributors keep reinventing or weakening them.

v5 widens the plugin surface: object-shaped `barrel`, opt-out `false` values, and new `coercion`, `infinite`, `query`, and `mutation` blocks. That widening makes problem 1 worse and forces an architectural answer.

## Decision

The Kubb Agent is a generic plugin host. It connects to Studio over an authenticated WebSocket, runs whatever plugins are installed in its image, and reports progress through a typed event stream. Trust flows from the operator who built the image to the agent process. Permission flows from Studio to the agent through an explicit grant.

### Generic plugin and adapter handling

`JSONKubbConfig.plugins[].options` is typed as an opaque `object` blob. The agent does not import plugin or adapter packages to type-check or validate their options. Option validation is the plugin's own responsibility.

### Image as the capability boundary

The set of available plugins is whatever is installed in the Docker image that runs the agent. The default image ships first-party plugins; operators who need community plugins build their own image. The agent never installs packages at runtime.

When Studio sends a `connect` command, the agent replies with a `ConnectedMessage` whose `payload.config` carries the loaded `JSONKubbConfig` and granted permissions. Studio reads that payload and renders the configuration UI from it. The `ConnectedMessage` payload is the manifest; there is no separate endpoint for it.

### Session pool

On startup the agent creates a pool of WebSocket sessions (`KUBB_AGENT_POOL_SIZE`, default `1`). Each session gets its own isolated event emitter so lifecycle events from one generation run do not bleed into another. On session close the agent reconnects after `KUBB_AGENT_RETRY_TIMEOUT` milliseconds (default 30 000).

### Studio as the orchestrator and AI integration point

The agent's outbound connection sequence is:

```
POST  {studioUrl}/api/agent/connect                  (registers machineToken, reports pool size)
POST  {studioUrl}/api/agent/session/create           (returns wsUrl, sessionId, isSandbox)
WSS   {wsUrl}  Authorization: Bearer {token}         (bidirectional command/data stream)
POST  {studioUrl}/api/agent/session/:id/disconnect   (on shutdown or error)
```

Studio sends `command` messages (`generate`, `connect`, `publish`). The agent responds with `connected`, `data`, `ping`, `disconnect`, and `kubb:error` messages. AI assistants integrate at the Studio level or through `@kubb/mcp`, not by calling the agent directly. This keeps the agent's surface small and lets Studio enforce access controls before any work reaches the agent.

### WebSocket event stream

`setupEventsStream` subscribes to the agent-internal `AsyncEventEmitter<KubbHooks>` and forwards selected events to Studio as `DataMessage` frames. Each frame carries a `source` field (`generate` or `publish`) so Studio can distinguish concurrent streams.

The forwarded events are:

| Event | Payload |
| ----- | ------- |
| `kubb:plugin:start` | `[ctx: { plugin: { name: string } }]` |
| `kubb:plugin:end` | `[ctx: { plugin: { name: string }; duration: number; success: boolean }]` |
| `kubb:files:processing:start` | `[ctx: { total: number }]` |
| `kubb:file:processing:update` | `[ctx: { file: string; processed: number; total: number; percentage: number }]` |
| `kubb:files:processing:end` | `[ctx: { total: number }]` |
| `kubb:generation:start` | `[ctx: { name?: string; plugins: number }]` |
| `kubb:generation:end` | `[ctx: { config: Config; files: FileNode[]; sources: Record<string, string> }]` |
| `kubb:info` | `[ctx: { message: string; info?: string }]` |
| `kubb:success` | `[ctx: { message: string; info?: string }]` |
| `kubb:warn` | `[ctx: { message: string; info?: string }]` |
| `kubb:error` | `[ctx: { message: string; stack?: string }]` |

The `sources` field in `kubb:generation:end` is converted from `Map<string, string>` to `Record<string, string>` before sending, since Maps are not JSON-serializable.

### Security model

The threat model assumes the agent runs user-controlled code (plugins) and processes user-controlled data (OpenAPI specs, plugin options), and that commands may originate from a Studio session driven by an LLM. The controls work in layers. If one breaks, the others hold.

#### Trust boundary at the image

Only packages installed in the image at build time are loadable. The agent never runs `npm install` at runtime. Operators who want a different plugin set rebuild the image. The default `kubb.config.ts` lives at `/kubb/agent/data/kubb.config.ts` and is bind-mountable. `KUBB_AGENT_ROOT` constrains where relative config paths resolve.

#### Authenticated outbound connection

`KUBB_AGENT_TOKEN` is the bearer token for all requests to Studio. Without it the agent does not start. Each registration request also carries a `machineToken`: a SHA-256 hash of `KUBB_AGENT_SECRET`. If `KUBB_AGENT_SECRET` is not set, the agent generates a random fallback on startup and logs a warning. Studio binds a token to the first machine it sees and rejects later connections from a different `machineToken`. A leaked `KUBB_AGENT_TOKEN` cannot be reused on another host without also knowing the original `KUBB_AGENT_SECRET`.

#### Permission grants from Studio

Permissions are explicit fields on the `connect` command and on `ConnectedMessage`:

- `allowAll`: grants every permission, including write and publish.
- `allowWrite`: lets the agent write generated files to disk; defaults to `false`.
- `allowPublish`: lets Studio trigger a `publish` command (e.g. `npm publish`); defaults to `false`.

The operator sets these via environment variables (`KUBB_AGENT_ALLOW_ALL`, `KUBB_AGENT_ALLOW_WRITE`, `KUBB_AGENT_ALLOW_PUBLISH`). Setting `KUBB_AGENT_ALLOW_ALL=true` implies write and publish. The agent echoes the effective permissions back to Studio so the UI reflects what is currently allowed. Studio cannot enable a permission the operator did not set.

#### Sandbox mode

When Studio provisions a session for the shared Sandbox Agent, the session response carries `isSandbox: true`. In sandbox mode:

- `allowAll`, `allowWrite`, and `allowPublish` are forced to `false` regardless of env vars. Generated files are never written to disk; they stream back over the WebSocket.
- The `input` field on a `generate` payload is honored as inline OpenAPI content. Outside sandbox mode this field is silently ignored.

The asymmetry is intentional. The shared sandbox is a multi-user environment where disk writes would be a security incident. User-owned agents run on the operator's machine, where the operator decides whether writes are acceptable.

#### Session config cache

When a `generate` command arrives with a payload and `allowWrite` is enabled, the agent saves the `JSONKubbConfig` to Nitro's key-value storage under `configs:{sessionId}`. On the next `generate` command without a payload, the agent replays the most recently saved config. This lets Studio send a config once and re-trigger generation without re-sending the full payload.

#### Session lifecycle and revocation

Studio sends a `disconnect` message with `reason: 'expired'` or `reason: 'revoked'`. On `expired` the agent reconnects. On `revoked` the agent closes the session without reconnecting.

#### Keep-alive heartbeat

The agent sends a WebSocket `ping` frame to Studio every `KUBB_AGENT_HEARTBEAT_INTERVAL` milliseconds (default 30 000). Studio replies with a `pong` frame. If the connection drops, the next unanswered ping triggers a reconnect.

#### Operational logging

The agent logs every step of the connect, generate, publish, and disconnect flows to stdout. Operators forward stdout to whatever log infrastructure they use. No telemetry leaves the process on its own.

## Rationale

Generic plugin handling decouples agent releases from plugin releases. A community plugin author ships when they want to, and one agent binary works across any plugin combination.

Pinning the trust boundary to the image keeps control with the operator. The operator picks what is in the image; what is in the image is what can run. Runtime installs would shift that control to whoever sends a request, which is the wrong direction for a process that may be driven by an LLM.

Routing AI assistants through Studio or `@kubb/mcp` limits the agent's attack surface to a single outbound WebSocket. Studio already has session management, auth, and audit. Recreating those in the agent duplicates work and weakens the boundary.

The permissions model is env-var-controlled. Studio asks for what it wants, the operator decides what to allow, and the agent enforces the intersection. A compromised Studio session cannot write to disk on a user-owned agent unless the operator also set `KUBB_AGENT_ALLOW_WRITE=true`.

The machine binding makes a leaked token harder to exploit. The attacker also needs the original `KUBB_AGENT_SECRET`. That tradeoff is worth the occasional rebind when an agent moves machines.

## Consequences

### Positive

- One `@kubb/agent` build works against any plugin combination, including community packages.
- The trust boundary is named and lives in one place: the Docker image.
- A leaked `KUBB_AGENT_TOKEN` is not enough to impersonate the agent; the attacker also needs `KUBB_AGENT_SECRET`.
- The sandbox agent is safe to share across users because disk writes are unconditionally disabled.
- Permission grants flow from operator env vars, not from Studio commands. The operator stays in charge.
- AI integrations have a single, documented entry point (Studio or MCP). The agent stays a small, focused executor.

### Negative

- Adding a plugin requires rebuilding and redeploying the image. There is no hot-add.
- The agent cannot give type-level feedback on misconfigured plugin options. Errors surface when the factory runs.
- Plugins that ship without a YAML schema are not configurable from Studio's form UI.
- Studio is on the critical path. An agent without Studio is a no-op.
- Rotating `KUBB_AGENT_SECRET` changes the `machineToken` and requires re-registering with Studio.

## Considered options

**Option A: Studio-orchestrated agent with image-bound plugins (chosen)**

The agent is a WebSocket client to Studio. Plugins are opaque and discovered from the image. Permissions flow from operator env vars; Studio cannot exceed them. AI callers integrate at Studio.

**Option B: Agent exposes its own public HTTP/WebSocket API**

The agent runs its own auth, session management, and rate limiting, and AI callers hit it directly. Rejected because it duplicates Studio's session layer, doubles the audit surface, and risks the two implementations drifting apart.

**Option C: Curated allowlist of supported plugins**

The agent ships TypeScript types for a known plugin set and rejects anything else. Predictable and well-typed, but blocks community plugins and forces an agent release for every option change.

**Option D: Runtime `npm install` on demand**

Maximum flexibility for plugin selection. Rejected because the trust boundary moves from the operator-controlled image to whatever any caller can request, and reproducibility cannot be guaranteed.

**Option E: Embed an LLM in the agent process**

An in-process LLM interprets natural-language requests and produces `kubb.config.ts` content. Rejected because it couples the agent to a specific model and forces the agent to validate its own LLM output. External AI callers driving Studio reach the same outcome without putting a model inside the executor.

## Related ADRs

None.
