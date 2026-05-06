# ADR-0003: Kubb Agent architecture and security model

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the long-running process that runs Kubb code generation on behalf of Kubb Studio. The agent runs locally or inside a Docker container on the operator's infrastructure. Studio runs as a hosted service at `https://kubb.studio` or a self-hosted instance.

The agent is a WebSocket client, not a public HTTP server. On startup it registers with Studio, opens one or more WebSocket sessions, and waits for commands. AI assistants and CI pipelines that want to drive code generation go through Studio; Studio fans the work out to a connected agent.

Three problems pushed this ADR:

1. The v4 `JSONKubbConfig` partially typed plugin options, coupling the agent binary to first-party plugin versions and excluding community packages.
2. There is no written record of where the trust boundary sits, even though the agent runs user-controlled code (plugins) on behalf of a remote orchestrator (Studio).
3. The machine binding, sandbox isolation, and permissions model that already exist in code are not captured in any architecture document.

## Decision

The Kubb Agent is a generic plugin host. It connects to Studio over an authenticated WebSocket, runs whatever plugins are installed in its image, and reports progress through a typed event stream.

### Plugin handling

`JSONKubbConfig.plugins[].options` is typed as an opaque `object` blob. The agent does not import plugin or adapter packages to type-check or validate their options. Option validation is the plugin's own responsibility.

### Image as the capability boundary

The set of available plugins is whatever is installed in the Docker image. The default image ships first-party plugins; operators who need community plugins build their own image. The agent never installs packages at runtime.

### Session pool

On startup the agent creates a pool of WebSocket sessions (`KUBB_AGENT_POOL_SIZE`, default `1`). Each session gets its own isolated event emitter so lifecycle events from one generation run do not bleed into another.

### Security model

The threat model assumes the agent runs user-controlled code and processes user-controlled data, and that commands may originate from an LLM-driven Studio session. Four controls layer the defense:

1. **Image boundary** — only packages installed at image build time are loadable. `KUBB_AGENT_ROOT` constrains where config paths resolve.
2. **Machine binding** — each registration carries a `machineToken` (SHA-256 of `KUBB_AGENT_SECRET`). Studio binds a token to the first machine it sees; a leaked `KUBB_AGENT_TOKEN` cannot be reused on a different host without also knowing `KUBB_AGENT_SECRET`.
3. **Permission grants** — permissions (`filesystem`, `publish`, `yolo`) are set by the operator via `KUBB_PERMISSION_*` env vars or `kubb.config.ts` (see [ADR-0004](./0004_permissions.md)). Studio cannot exceed the permissions the operator set.
4. **Sandbox mode** — sessions provisioned as sandbox force all permissions to `false` regardless of env vars. Generated files stream back over the WebSocket and are never written to disk.

## Rationale

Generic plugin handling decouples agent releases from plugin releases. One agent binary works across any plugin combination, including community packages.

Pinning the trust boundary to the image keeps control with the operator. Runtime installs would shift that control to whoever sends a request, which is the wrong direction for a process that may be driven by an LLM.

Routing AI assistants through Studio or `@kubb/mcp` limits the agent's attack surface to a single outbound WebSocket. Studio already has session management, auth, and audit; recreating those in the agent duplicates work and weakens the boundary.

## Consequences

### Positive

- One `@kubb/agent` build works against any plugin combination, including community packages.
- A leaked `KUBB_AGENT_TOKEN` is not enough to impersonate the agent; the attacker also needs `KUBB_AGENT_SECRET`.
- The sandbox agent is safe to share across users because disk writes are unconditionally disabled.
- Permission grants flow from operator config, not from Studio commands. The operator stays in charge.

### Negative

- Adding a plugin requires rebuilding and redeploying the image. There is no hot-add.
- The agent cannot give type-level feedback on misconfigured plugin options. Errors surface when the factory runs.
- Plugins without a YAML schema are not configurable from Studio's form UI.
- Studio is on the critical path. An agent without Studio is a no-op.
- Rotating `KUBB_AGENT_SECRET` changes the `machineToken` and requires re-registering with Studio.

## Considered options

**Option A: Studio-orchestrated agent with image-bound plugins (chosen)**

The agent is a WebSocket client to Studio. Plugins are opaque and discovered from the image. Permissions flow from operator config; Studio cannot exceed them. AI callers integrate at Studio.

**Option B: Agent exposes its own public HTTP/WebSocket API**

AI callers hit the agent directly. Rejected because it duplicates Studio's session layer, doubles the audit surface, and risks the two implementations drifting apart.

**Option C: Curated allowlist of supported plugins**

The agent ships TypeScript types for a known plugin set and rejects anything else. Rejected because it blocks community plugins and forces an agent release for every option change.

**Option D: Runtime `npm install` on demand**

Rejected because the trust boundary moves from the operator-controlled image to whatever any caller can request.

**Option E: Embed an LLM in the agent process**

Rejected because it couples the agent to a specific model and forces the agent to validate its own LLM output. External AI callers driving Studio reach the same outcome without putting a model inside the executor.

## Related ADRs

- [ADR-0004](./0004_permissions.md) — Permissions in `defineConfig` and `KUBB_PERMISSION_*` env vars
