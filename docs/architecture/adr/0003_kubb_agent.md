# ADR-0003: Kubb Agent architecture and security model

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the long-running process that runs Kubb code generation on behalf of Kubb Studio. The agent runs locally or in a Docker container on the operator's infrastructure. Studio runs as a hosted service at `https://kubb.studio` or as a self-hosted instance.

The agent is a WebSocket client, not a public HTTP server. On startup it registers with Studio, opens one or more WebSocket sessions, and waits for commands. AI assistants and CI pipelines that want to drive code generation go through Studio, which routes the work to a connected agent.

Three problems pushed this ADR:

1. The v4 `JSONKubbConfig` only partially typed plugin options. That coupled the agent binary to first-party plugin versions and locked out community packages.
2. The trust boundary was not written down anywhere, even though the agent runs user-controlled code (plugins) on behalf of a remote orchestrator (Studio).
3. The machine binding, sandbox isolation, and permission model already existed in code but were missing from any architecture document.

## Decision

The Kubb Agent is a generic plugin host. It connects to Studio over an authenticated WebSocket, runs whatever plugins are installed in its image, and reports progress through a typed event stream.

### Plugin handling

`JSONKubbConfig.plugins[].options` is typed as an opaque `object`. The agent does not import plugin or adapter packages to type-check or validate their options. Each plugin validates its own options.

### Image as the capability boundary

The set of available plugins is whatever the Docker image installs. The default image ships first-party plugins. Operators who need community plugins build their own image. The agent never installs packages at runtime.

### Session pool

On startup the agent creates a pool of WebSocket sessions (`KUBB_AGENT_POOL_SIZE`, default `1`). Each session gets its own event emitter so lifecycle events from one generation run never leak into another.

### Security model

The threat model assumes the agent runs user-controlled code, processes user-controlled data, and may receive commands that originated from an LLM-driven Studio session. Four controls provide layered defense.

1. **Image boundary.** Only packages installed at image build time are loadable. `KUBB_AGENT_ROOT` constrains where config paths resolve.
2. **Machine binding.** Each registration carries a `machineToken` (SHA-256 of `KUBB_AGENT_SECRET`). Studio binds the token to the first machine it sees. A leaked `KUBB_AGENT_TOKEN` cannot be reused on a different host without `KUBB_AGENT_SECRET`.
3. **Permission grants.** Active permissions (`filesystem`, `yolo`) are set by the operator through `KUBB_PERMISSION_*` env vars or `kubb.config.ts`. Future permission names are documented in [ADR-0004](./0004_permissions.md). Studio cannot exceed what the operator granted.
4. **Sandbox mode.** Sandbox sessions force all active permissions to `'none'` regardless of env vars. Generated files stream back over the WebSocket and never touch disk.

## Rationale

Treating plugins as opaque decouples agent releases from plugin releases. One agent binary works against any plugin combination, including community packages.

Pinning the trust boundary to the image keeps control with the operator. Runtime installs would move that control to whoever sends the request, which is the wrong direction for a process that may be driven by an LLM.

Routing AI callers through Studio or `@kubb/mcp` shrinks the agent's attack surface to a single outbound WebSocket. Studio already handles sessions, auth, and audit. Rebuilding those inside the agent duplicates work and weakens the boundary.

## Consequences

### Positive

- One `@kubb/agent` build works against any plugin combination, including community packages.
- A leaked `KUBB_AGENT_TOKEN` is not enough to impersonate the agent; the attacker also needs `KUBB_AGENT_SECRET`.
- The sandbox agent is safe to share across users because disk writes are unconditionally disabled.
- Permission grants flow from operator config, not from Studio commands. The operator stays in charge.

### Negative

- Adding a plugin means rebuilding and redeploying the image. There is no hot-add.
- The agent cannot give type-level feedback on bad plugin options. Errors surface when the factory runs.
- Plugins without a YAML schema cannot be configured from Studio's form UI.
- Studio sits on the critical path. An agent without Studio is a no-op.
- Rotating `KUBB_AGENT_SECRET` changes the `machineToken` and requires re-registering with Studio.

## Considered options

**Option A: Studio-orchestrated agent with image-bound plugins (chosen)**

The agent is a WebSocket client to Studio. Plugins are opaque and discovered from the image. Permissions come from operator config, and Studio cannot exceed them. AI callers integrate at Studio.

**Option B: Agent exposes its own public HTTP/WebSocket API**

AI callers hit the agent directly. Rejected because it duplicates Studio's session layer, doubles the audit surface, and lets the two implementations drift apart.

**Option C: Curated allowlist of supported plugins**

The agent ships TypeScript types for a known plugin set and rejects anything else. Rejected because it blocks community plugins and forces an agent release for every option change.

**Option D: Runtime `npm install` on demand**

Rejected because the trust boundary moves from the operator-controlled image to whatever any caller can request.

**Option E: Embed an LLM in the agent process**

Rejected because it ties the agent to a specific model and asks the agent to validate its own LLM output. External AI callers driving Studio reach the same outcome without putting a model inside the executor.

## Related ADRs

- [ADR-0004](./0004_permissions.md) — Permissions in `defineConfig` and `KUBB_PERMISSION_*` env vars
