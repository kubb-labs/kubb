# ADR-0002: Kubb Agent architecture and security model

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the long-running process that runs Kubb code generation on behalf of Kubb Studio. The agent runs locally or inside a Docker container on the operator's infrastructure. Studio runs as a hosted service at `https://studio.kubb.dev` (or a self-hosted instance).

The agent is a WebSocket client, not a public HTTP server. On startup it dials out to Studio and registers itself, opens a session, and waits for commands. The only inbound HTTP route the agent exposes is `GET /api/health` for container probes.

This protocol shapes every decision below. AI assistants and CI pipelines that want to drive code generation do not call the agent directly. They go through Studio, and Studio fans the work out to a connected agent.

Three problems pushed this ADR:

1. The v4 `JSONKubbConfig` partially typed plugin options, coupling the agent binary to first-party plugin versions and locking out community packages.
2. There is no written record of where the trust boundary sits, even though the agent runs user-controlled code (plugins) on behalf of a remote orchestrator (Studio).
3. The machine binding, sandbox isolation, and permissions model that already exist in code are not captured in any architecture document, so future contributors keep reinventing or weakening them.

v5 widens the plugin surface (object-shaped `barrel`, opt-out `false` values, new `coercion`, `infinite`, `query`, and `mutation` blocks). That widening makes problem 1 worse and forces an architectural answer.

## Decision

The Kubb Agent is a generic plugin host that connects out to Studio over an authenticated WebSocket, runs whatever plugins are installed in its image, and reports progress through a typed event stream. Trust flows from the operator who built the image to the agent process; permission flows from Studio to the agent through an explicit grant.

### Generic plugin and adapter handling

`JSONKubbConfig.plugins[].options` and any future `JSONKubbConfig.adapter` block are typed as opaque `object` blobs. The agent does not import plugin or adapter packages to type or validate their options. `resolvePlugins` works off package names; option validation is the plugin's own responsibility.

### Image as the capability boundary

The set of available plugins and adapters is whatever is installed in the Docker image that runs the agent. The default image at `kubblabs/kubb-agent` ships first-party plugins; operators who need community plugins or custom adapters build their own image with those packages added. The agent never installs packages at runtime.

When Studio sends a `connect` command, the agent replies with a `ConnectedMessage` whose `payload.config` carries the loaded `JSONKubbConfig` (version, configPath, plugins, granted permissions). Studio reads that payload and renders the configuration UI from it. The agent does not expose a separate manifest endpoint; the `ConnectedMessage` payload is the manifest.

### Studio as the orchestrator and AI integration point

The agent's outbound connection sequence is fixed:

```
POST  {studioUrl}/api/agent/connect          (registers machineToken)
POST  {studioUrl}/api/agent/session/create   (returns wsUrl, sessionId, isSandbox)
WSS   {wsUrl}                                (bidirectional command/data stream)
POST  {studioUrl}/api/agent/session/:id/disconnect  (on shutdown)
```

Studio sends `command` messages (`generate`, `connect`, `publish`); the agent responds with `connected`, `data`, `ping`, and `kubb:error` messages. AI assistants integrate at the Studio level (or through `@kubb/mcp`), not by calling the agent directly. This keeps the agent's surface small and lets Studio enforce its own access controls before any work reaches the agent.

### Security model

The threat model assumes the agent runs user-controlled code (plugins) and processes user-controlled data (OpenAPI specs, plugin options), and that commands may originate from a Studio session that was itself driven by an LLM. The controls below layer to keep a single broken layer from being catastrophic.

#### Trust boundary at the image

Only packages installed in the image at build time are loadable. The agent never runs `npm install` at runtime. Operators who want a different plugin set rebuild the image. The default `kubb.config.ts` lives at `/kubb/agent/data/kubb.config.ts` and is bind-mountable; `KUBB_AGENT_ROOT` constrains where relative paths may resolve.

#### Authenticated outbound connection

The agent connects to Studio with `KUBB_AGENT_TOKEN` as a bearer token. Without the token the agent does not connect. Each request also carries a `machineToken`: a SHA-256 of the host's network interfaces and hostname. Studio binds a token to the first machine it sees, and rejects later connections from a different machine token. A leaked `KUBB_AGENT_TOKEN` cannot be reused on another host without also matching the original `machineToken`.

#### Permission grants from Studio

Permissions are explicit fields on the `connect` command and on `ConnectedMessage`:

- `allowAll`: grants every permission, including write and publish.
- `allowWrite`: lets the agent write generated files to disk; defaults to `false`.
- `allowPublish`: lets Studio trigger a `publish` command (e.g. `npm publish`); defaults to `false`.

These are set from environment variables (`KUBB_AGENT_ALLOW_WRITE`, `KUBB_AGENT_ALLOW_ALL`) at the operator's choice, then echoed back to Studio so the UI shows what is currently allowed. Studio cannot enable a permission that the operator did not grant via env var.

#### Sandbox mode

When Studio provisions a session for the shared Sandbox Agent, the session response carries `isSandbox: true`. In sandbox mode:

- `output.write` is forced to `false`. Generated files never touch the host filesystem; they are streamed back over the WebSocket.
- The `input` field on a `generate` payload is honored as inline OpenAPI content. Outside sandbox mode this field is silently ignored.
- The agent runs in a shared Docker environment, so disk isolation is enforced regardless of what a generate payload requests.

The asymmetry is intentional: the shared sandbox is a multi-user environment where any disk write would be a security incident. User-owned agents run on the operator's machine, where the operator decides whether disk writes are acceptable.

#### Bounded shell execution

Disk configs may declare `hooks.done` shell commands. Sandbox configs may not. When the agent receives a `publish` command, the publisher (currently `npm`) and an optional command override route through `publish.ts`, which only runs commands the operator has explicitly enabled.

#### Session lifecycle and revocation

Sessions expire after 24 hours. Studio re-validates the session on every incoming agent message and disconnects immediately on revocation. Cached session tokens live in `./.kubb/data` (or the `agent_kv` Docker volume) as hashed values, so the cache is non-reversible if the host is later compromised.

#### Operational telemetry

The agent logs every step of the connect, generate, and disconnect flows to stdout. Operators forward stdout to whatever log infrastructure they use. An optional `KUBB_AGENT_HEARTBEAT_URL` pings an external healthcheck endpoint every 5 minutes; when unset, no telemetry leaves the agent process.

## Rationale

Generic plugin handling decouples agent releases from plugin releases. A community plugin author ships when they want to, and one agent binary works across any plugin combination.

Pinning the trust boundary to the image keeps control with the operator. The operator picks what is in the image; what is in the image is what can run. Runtime installs would shift that control to whoever sends a request, which is the wrong direction for a process that may be driven by an LLM.

Routing AI assistants through Studio (or `@kubb/mcp`) instead of giving the agent its own public API keeps the agent's attack surface to a single outbound WebSocket. Studio already has session management, auth, and audit; recreating those in the agent would duplicate work and weaken the boundary.

The permissions model is deliberately env-var-controlled. Studio asks for what it wants, the operator decides what to allow, and the agent enforces the intersection. That ordering means a compromised Studio session cannot write to disk on a user-owned agent unless the operator also set `KUBB_AGENT_ALLOW_WRITE=true`.

The machine binding adds one more failure mode for a leaked token, which is worth the small operational cost (rebinding when an agent moves machines).

## Consequences

### Positive

- One `@kubb/agent` build works against any plugin and adapter combination, including community packages.
- The trust boundary is named and lives in one place: the Docker image.
- A leaked agent token is not enough to impersonate the agent; the attacker also needs the original host's `machineToken`.
- The sandbox agent is safe to share across users because disk writes are unconditionally disabled.
- Permission grants flow from operator env vars, not from Studio commands. The operator stays in charge.
- AI integrations have a single, documented entry point (Studio or MCP), and the agent stays a small, focused executor.

### Negative

- Adding a plugin requires rebuilding and redeploying the image. There is no hot-add.
- The agent cannot give early type-level feedback on misconfigured plugin options. Errors surface when the factory runs.
- Plugins that ship without a YAML schema are not configurable from Studio's form UI.
- Studio is on the critical path. An agent without Studio is a no-op.
- Machine binding can surprise operators who move an agent to a new host. They must reset the cached session before the agent can reconnect.

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
