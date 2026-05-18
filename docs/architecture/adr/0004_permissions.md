# ADR-0004: Permissions as a shared middleware

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3246](https://github.com/kubb-labs/kubb/pull/3246) | 2026-05-08    |

## Context

ADR-0003 set up operator-controlled permissions for `@kubb/agent` Studio sessions. Today, permissions are configured through three env vars and two CLI flags on `kubb agent start`:

| Env var                    | CLI flag        | Effect                                                       |
| -------------------------- | --------------- | ------------------------------------------------------------ |
| `KUBB_AGENT_ALLOW_WRITE`   | `--allow-write` | Allow the agent to write generated files to disk.            |
| `KUBB_AGENT_ALLOW_ALL`     | `--allow-all`   | Grant every permission. Implies `KUBB_AGENT_ALLOW_WRITE`.    |

`@kubb/core`'s `defineConfig` has no `permissions` field. Operators cannot declare intent inside `kubb.config.ts`. Every deployment has to set env vars or pass CLI flags on every invocation.

Three problems follow.

1. **The config is not self-contained.** A project that always needs filesystem writes has to repeat that grant in every CI workflow, every Docker run, and every local invocation.
2. **The `KUBB_AGENT_ALLOW_*` namespace does not scale.** It ties permission semantics to one package and encodes only an on/off state. Adding `network`, `git`, or `run` later would require a new naming convention.
3. **`@kubb/mcp` will need the same model.** MCP is also an LLM-driven host that should gate filesystem writes, publish, and network access. Putting the permission types inside `@kubb/agent` forces MCP to either reimplement the same logic or take an awkward dependency on the agent package just for the types.

## Decision

Permissions live in a new shared package, `@kubb/middleware-permissions`. Hosts that need to gate capabilities (today `@kubb/agent`, soon `@kubb/mcp`) consume it. `@kubb/core` is not modified.

### Why middleware

`Middleware` is the existing extension point for "add things to a Kubb config without touching core." Its contract requires a `name` and allows optional pipeline hooks. A middleware that registers no hooks and only carries `options` is structurally valid. Hosts read it the same way `@kubb/agent` already detects `middlewareBarrel` today: `config.middleware?.find(m => m.name === middlewarePermissionsName)`.

This avoids three things that a `permissions` field on `Config` would need: a TypeScript declaration merge, a parallel `defineAgentConfig` helper, or a breaking change to `@kubb/core`.

### Surface

Operators add the middleware to their config:

```ts
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { middlewarePermissions } from '@kubb/middleware-permissions'

export default defineConfig({
  middleware: [
    middlewarePermissions({ filesystem: 'write' }),
  ],
  plugins: [/* ... */],
})
```

The shorthand grants the same level to every active permission, matching GitHub Actions' `write-all` and `read-all` syntax:

```ts
middlewarePermissions('write-all')
middlewarePermissions('read-all')
```

### Permission vocabulary

Each permission uses one of three levels: `none`, `read`, or `write`. Permissions without a meaningful read state only support `none` and `write`.

| Field        | Levels                  | Status   | Notes                                                       |
| ------------ | ----------------------- | -------- | ----------------------------------------------------------- |
| `filesystem` | `none`, `read`, `write` | Active   | `write` writes generated files to disk.                           |
| `publish`    | `none`, `write`         | Active   | `write` runs the publish command (e.g. `npm publish`).            |
| `network`    | `none`, `read`, `write` | Reserved | `read` fetches specs. `write` allows general outbound HTTP.       |
| `run`        | `none`, `write`         | Reserved | Execute shell commands.                                           |
| `env`        | `none`, `read`          | Reserved | Read host environment variables.                                  |
| `git`        | `none`, `read`, `write` | Reserved | `read` inspects the repo. `write` commits and pushes generated files. |

Reserved fields are accepted by the type but not enforced yet. They reserve the name so future activation does not break configs.

### Env vars and CLI flags

Hosts read the same vocabulary from env vars and CLI flags. Both surfaces stay flat in name. The CLI uses dotted args so it mirrors the config object literal.

```bash
# shorthand
KUBB_PERMISSIONS=write-all
kubb agent start --permissions write-all

# individual
KUBB_PERMISSION_FILESYSTEM=write
kubb agent start --permission.filesystem write
```

The mixed singular/plural is intentional. `--permissions` is plural because it sets the whole object. `--permission.filesystem` is singular because it sets one permission. Each form reads naturally aloud.

### Migration table

| Old (removed)              | New                                  |
| -------------------------- | ------------------------------------ |
| `KUBB_AGENT_ALLOW_WRITE`   | `KUBB_PERMISSION_FILESYSTEM=write`   |
| `KUBB_AGENT_ALLOW_ALL`     | `KUBB_PERMISSIONS=write-all`         |
| `--allow-write`            | `--permission.filesystem write`      |
| `--allow-all`              | `--permissions write-all`            |

### Merge semantics

`@kubb/middleware-permissions` exports a `resolvePermissions(middlewareOptions, env)` helper. Hosts call it once at startup. The merge is additive, like GitHub Actions:

1. Start from `none` for every permission.
2. Apply the `KUBB_PERMISSIONS` shorthand if set.
3. Apply individual `KUBB_PERMISSION_*` env vars.
4. Apply the middleware shorthand or per-permission options.
5. Take `max(level)` across all sources where `write > read > none`.

Either the config or an env var can grant a permission. Neither can revoke a grant the other made. CLI flags pass through to env vars before the merge runs.

### Host responsibilities

`@kubb/middleware-permissions` is purely declarative. It does not enforce anything itself. That work belongs to each host.

| Host           | Reads middleware | Enforces                                          |
| -------------- | ---------------- | ------------------------------------------------- |
| `@kubb/agent`  | Yes              | Filesystem writes, publish command, sandbox sessions. |
| `@kubb/mcp`    | Yes              | Same as the agent, scoped to MCP's request lifecycle. |
| `kubb generate` (CLI) | No        | The user invoked the command. The OS gates everything. |
| `unplugin-kubb`| No               | Runs inside the user's own build.                 |

A non-host context that sees the middleware in a config does nothing with it. The middleware is a no-op outside hosts, which matches how `middlewareBarrel` behaves when no plugin emits files.

## Rationale

A middleware fits the existing extension story. `@kubb/core` already has plugins, parsers, adapters, and middleware as the four extension kinds. Permissions are an extension concern, not a core concern, so they take the kind that exists for "add to Kubb without touching core."

A shared package decouples permissions from any single host. `@kubb/agent` and `@kubb/mcp` consume the same types, the same merge helper, and the same env-var convention. Adding a third host later costs one import.

GitHub Actions' `write-all` / `read-all` shorthand is recognizable. Operators familiar with GitHub workflows get the model for free, and the additive merge follows the same rule: grants stack and nothing implicitly revokes.

Reserved fields in the vocabulary make the surface forward-compatible. Activating `network` or `git` later does not require a config rewrite for projects that already declared them.

The mixed singular/plural CLI naming follows English usage. Forcing `--permissions.filesystem` for consistency would read worse and would not change how citty parses the args.

## Consequences

### Positive

- `@kubb/core` ships unchanged. No declaration merging, no `defineAgentConfig` helper, no breaking type change.
- `@kubb/agent` and `@kubb/mcp` share one package. Adding a future host costs one import.
- `kubb.config.ts` fully describes the project's required capabilities. Operators set them once instead of repeating env vars in every deployment.
- The `write-all` / `read-all` shorthand maps directly to GitHub Actions, which lowers the learning cost.
- Reserved permission names are forward-compatible. Activating a reserved name later does not break existing configs.

### Negative

- Operators using `KUBB_AGENT_ALLOW_*` env vars or `--allow-*` CLI flags must migrate to `KUBB_PERMISSION_*` and `--permission.*` when upgrading.
- Middleware is overloaded slightly. A `middlewarePermissions()` entry registers no pipeline hooks, which may surprise contributors who expect every middleware to transform `FileNode`s. The `@kubb/core` middleware docs need a short note that metadata-only middleware is supported.
- Reserved fields in the type are silently ignored by hosts until activated. Operators who set them get no signal that the grant has no effect yet.
- Additive merge means the config cannot restrict a permission that an env var or CLI flag granted. Hosts that need to clamp permissions do so through their own controls (e.g., the agent's sandbox sessions from ADR-0003).

## Considered options

**Option A: `middlewarePermissions()` in a shared package (chosen)**

A new `@kubb/middleware-permissions` package owns the types, the factory, and the merge helper. `@kubb/agent` and `@kubb/mcp` consume it. `@kubb/core` is untouched.

**Option B: `permissions` field on `defineConfig` via declaration merging**

`@kubb/agent` augments `@kubb/core`'s `Config` interface with `permissions?: Permissions`. The user gets autocomplete by importing `@kubb/agent`. Rejected because `@kubb/mcp` would need the same augmentation, and two packages augmenting the same interface for the same field is fragile. Also requires changing `Config` from a type alias to an interface in core.

**Option C: `defineAgentConfig` helper that wraps `defineConfig`**

`@kubb/agent` exports its own helper returning `Config & { permissions?: Permissions }`. Users who want permissions opt in by replacing `defineConfig` with `defineAgentConfig`. Rejected because it splits the entry point and forces `@kubb/mcp` to ship a parallel `defineMcpConfig` helper.

**Option D: Env vars and CLI flags only (status quo)**

No config changes. Rejected because the config is not self-contained, and the `KUBB_AGENT_ALLOW_*` namespace does not scale to the reserved permission set.

**Option E: Sidecar config file (`kubb.permissions.ts`)**

A separate file the host reads alongside `kubb.config.ts`. Rejected because it splits the source of truth and adds a file to the project root for one feature.

## Related ADRs

- [ADR-0003](./0003_kubb_agent.md) — Kubb Agent architecture and security model
