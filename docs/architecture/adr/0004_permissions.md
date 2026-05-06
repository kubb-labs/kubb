# ADR-0004: Permissions in defineConfig and KUBB_PERMISSION_* env vars

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3246](https://github.com/kubb-labs/kubb/pull/3246) | 2026-05-06    |

## Context

ADR-0003 established the agent's security model and documented three permission flags — `allowAll`, `allowWrite`, and `allowPublish` — that control what a connected Studio session may do on the operator's machine. Those flags were set exclusively via environment variables (`KUBB_AGENT_ALLOW_ALL`, `KUBB_AGENT_ALLOW_WRITE`, `KUBB_AGENT_ALLOW_PUBLISH`) or the matching CLI flags (`--allow-all`, `--allow-write`).

Three problems emerged as the agent moved toward production use:

1. **Config is not self-contained.** Operators who want to allow filesystem writes must pass `--allow-write` on every `kubb agent start` invocation or set the env var in every deployment manifest. The intent is not visible in `kubb.config.ts` alongside the rest of the project's configuration.

2. **The `KUBB_AGENT_ALLOW_*` namespace is agent-specific and does not scale.** As the permission surface grows (network access, arbitrary shell execution, env var access), adding more `KUBB_AGENT_ALLOW_*` variables makes the naming inconsistent with the rest of the `KUBB_*` prefix hierarchy and ties permission semantics to one package.

3. **There is no reserved vocabulary for future permissions.** The permission set will grow. Without a named set, contributors will invent ad-hoc env vars that conflict or overlap.

## Decision

Permissions are declared in two places and merged with OR semantics at agent startup.

### 1. `permissions` field in `defineConfig`

`Config` gains an optional `permissions` object:

```ts
export default defineConfig({
  input: { path: './petstore.yaml' },
  output: { path: './src/gen' },
  permissions: {
    filesystem: true,  // agent may write generated files to disk
    publish: false,    // agent may not run publish commands
  },
})
```

The shape is:

| Field        | Maps to env var               | Status       | Description                                      |
| ------------ | ----------------------------- | ------------ | ------------------------------------------------ |
| `filesystem` | `KUBB_PERMISSION_FILESYSTEM`  | Active       | Write generated files to disk                    |
| `publish`    | `KUBB_PERMISSION_PUBLISH`     | Active       | Run publish commands (e.g. `npm publish`)        |
| `network`    | `KUBB_PERMISSION_NETWORK`     | Reserved     | Fetch API specs from remote URLs                 |
| `run`        | `KUBB_PERMISSION_RUN`         | Reserved     | Execute arbitrary shell commands                 |
| `env`        | `KUBB_PERMISSION_ENV`         | Reserved     | Read environment variables from the host system  |

Reserved fields are accepted by the type but not enforced by the agent yet. They exist so operators can write forward-compatible configs without waiting for a future type-system update.

### 2. Permission env vars under `KUBB_PERMISSION_*`

The old `KUBB_AGENT_ALLOW_*` env vars are replaced by `KUBB_PERMISSION_[name]`:

| Old (removed)              | New                          |
| -------------------------- | ---------------------------- |
| `KUBB_AGENT_ALLOW_WRITE`   | `KUBB_PERMISSION_FILESYSTEM` |
| `KUBB_AGENT_ALLOW_ALL`     | `KUBB_PERMISSION_ALL`        |
| `KUBB_AGENT_ALLOW_PUBLISH` | `KUBB_PERMISSION_PUBLISH`    |

### 3. OR merge semantics

At startup the `studio` plugin loads the kubb config from `resolvedConfigPath` and merges config permissions with the runtime flags:

```
effectiveFilesystem = KUBB_PERMISSION_ALL
                    || KUBB_PERMISSION_FILESYSTEM
                    || config.permissions?.filesystem

effectivePublish    = KUBB_PERMISSION_ALL
                    || KUBB_PERMISSION_PUBLISH
                    || config.permissions?.publish
```

Sandbox mode still forces all permissions to `false` regardless of config or env (see ADR-0003).

## Rationale

**Config as the primary surface.** The kubb config is already where all project-level decisions live. Putting permissions there means a single file fully describes what the agent is allowed to do, without requiring the operator to memorize CLI flags or set env vars in deployment manifests.

**`KUBB_PERMISSION_*` over `KUBB_AGENT_ALLOW_*`.** The new prefix separates the _what_ (a permission) from the _who_ (the agent). As permissions are checked in other packages or contexts (e.g. future middleware or a CI runner), the env var name stays meaningful. The old `AGENT`-scoped names would become misleading outside the agent package.

**Reserved vocabulary at type level.** Naming the future set now costs nothing and prevents naming debates later. `network`, `run`, and `env` match the Deno permissions model, which is widely understood by TypeScript practitioners.

**OR semantics, not AND.** Permissions are capabilities, not restrictions. A permission set in the config means "this project needs this capability"; a permission set in the env means "this deployment allows this capability". An operator can give a blanket grant via env var without editing every config file, or lock down a specific config without touching deployment manifests.

## Consequences

### Positive

- `kubb.config.ts` fully describes the required capabilities of a project without separate env var documentation.
- The `KUBB_PERMISSION_*` namespace scales to any number of future permission types without ambiguity.
- Reserved type fields mean forward-compatible configs are possible from day one.
- The sandbox override from ADR-0003 is unaffected; its guarantees are unchanged.

### Negative

- Operators using `KUBB_AGENT_ALLOW_*` env vars must migrate to `KUBB_PERMISSION_*` when upgrading.
- Reserved fields in the config type (`network`, `run`, `env`) are accepted by TypeScript but silently ignored by the agent until enforced, which could mislead operators who set them expecting immediate effect.
- OR merge semantics mean there is no way to use the config to restrict a permission that an env var grants. Operators who need strict restriction must rely solely on env vars and not set permissions in config.

## Considered options

**Option A: Env vars and CLI flags only (status quo)**

Permissions remain exclusively controlled by `KUBB_AGENT_ALLOW_*` env vars and CLI flags. No config changes. Rejected because the config is not self-contained and every deployment must carry the flags separately.

**Option B: Config only — remove env vars**

Permissions live only in `kubb.config.ts`. Env vars and CLI flags are removed. Rejected because deployment-level overrides (e.g. a CI job that enables publish but a dev workstation that does not) require being able to grant permissions without editing the config file.

**Option C: Config + renamed env vars with OR semantics (chosen)**

Both surfaces exist. The config sets project intent; env vars set deployment-level grants. OR semantics mean either source can enable a permission.

**Option D: Nested under `agent.permissions` rather than top-level `permissions`**

The field would be `config.agent.permissions` to signal it is only relevant to the agent package. Rejected because it adds nesting for no practical gain. `Config` already has a `permissions` field shape that is unambiguous, and the field is not exclusive to the agent (future packages may check it).

## Related ADRs

- [ADR-0003](./0003_kubb_agent.md) — Kubb Agent architecture and security model (establishes the permission model this ADR extends)
