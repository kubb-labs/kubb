# ADR-0004: Permissions in defineConfig and KUBB_PERMISSION_* env vars

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3246](https://github.com/kubb-labs/kubb/pull/3246) | 2026-05-06    |

## Context

ADR-0003 established operator-controlled permissions for Studio sessions. Before this ADR, the active runtime permissions were only configurable via env vars (`KUBB_AGENT_ALLOW_WRITE`, `KUBB_AGENT_ALLOW_ALL`) or CLI flags.

Two problems emerged:

1. The config is not self-contained. Operators must pass `--permission.filesystem` on every `kubb agent start` or set env vars in every deployment manifest.
2. The `KUBB_AGENT_ALLOW_*` namespace does not scale. It ties permission semantics to one package and leaves no room for a consistent future vocabulary.

## Decision

Permissions belong to `@kubb/agent`, not `@kubb/core`. Core config handles code generation; permissions are an agent concern.

Permissions can be set in two places and are merged at startup.

### `permissions` field in `kubb.config.ts`

The `permissions` field is defined by `@kubb/agent`. The agent reads it from the config file at startup. Each permission uses one of three levels: `none`, `read`, or `write`. Not every permission has a useful read state — those only support `none` and `write`.

```ts
export default defineConfig({
  permissions: {
    filesystem: 'write',  // write generated files to disk
  },
})
```

### Permission vocabulary

| Field        | Env var                       | Levels               | Status   | Notes                                                 |
| ------------ | ----------------------------- | -------------------- | -------- | ----------------------------------------------------- |
| `filesystem` | `KUBB_PERMISSION_FILESYSTEM`  | `none`, `read`, `write` | Active   | `write` = write generated files to disk              |
| `publish`    | `KUBB_PERMISSION_PUBLISH`     | `none`, `write`      | Reserved | Future permission for publish workflows               |
| `packages`   | `KUBB_PERMISSION_PACKAGES`    | `none`, `read`, `write` | Reserved | `read` = query registry; `write` = publish           |
| `network`    | `KUBB_PERMISSION_NETWORK`     | `none`, `read`, `write` | Reserved | `read` = fetch specs; `write` = general outbound HTTP |
| `run`        | `KUBB_PERMISSION_RUN`         | `none`, `write`      | Reserved | Execute shell commands                                |
| `env`        | `KUBB_PERMISSION_ENV`         | `none`, `read`       | Reserved | Read host environment variables                       |
| `git`        | `KUBB_PERMISSION_GIT`         | `none`, `read`, `write` | Reserved | `read` = inspect repo; `write` = commit, push, open PRs |
| `id-token`   | `KUBB_PERMISSION_ID_TOKEN`    | `none`, `write`      | Reserved | Exchange an OIDC token for Studio auth                |
| `checks`     | `KUBB_PERMISSION_CHECKS`      | `none`, `write`      | Reserved | Post generation results as CI check runs              |
| `statuses`   | `KUBB_PERMISSION_STATUSES`    | `none`, `write`      | Reserved | Post commit statuses to GitHub                        |

Reserved fields are accepted by the type but not enforced yet.

### Env var rename

The old `KUBB_AGENT_ALLOW_*` env vars are removed:

| Old (removed)              | New                          |
| -------------------------- | ---------------------------- |
| `KUBB_AGENT_ALLOW_WRITE`   | `KUBB_PERMISSION_FILESYSTEM` |
| `KUBB_AGENT_ALLOW_ALL`     | `KUBB_PERMISSION_YOLO`       |
### Merge semantics

The agent takes the highest level from env var and config using `max(a, b)` where `write > read > none`. `KUBB_PERMISSION_YOLO=true` grants `write` to all active permissions regardless of other settings.

```
filesystem = yolo ? write : max(KUBB_PERMISSION_FILESYSTEM, config.permissions?.filesystem)
```

Sandbox sessions force all permissions to `none` regardless of config or env (see ADR-0003).

## Rationale

Putting permissions in `kubb.config.ts` makes the config self-contained. Operators who always want filesystem writes set it once in the file instead of passing a flag on every invocation.

`KUBB_PERMISSION_*` separates the what (a permission) from the who (the agent). Reserved names prevent naming conflicts as the permission surface grows.

OR semantics treat permissions as capabilities, not restrictions. Either the config or an env var can grant a permission.

Levels (`none`, `read`, `write`) are borrowed from GitHub Actions' permission model. They let operators grant partial access — for example `network: 'read'` to allow spec fetching without opening general outbound HTTP.

## Consequences

### Positive

- `kubb.config.ts` fully describes the required capabilities without separate env var documentation.
- The `KUBB_PERMISSION_*` namespace scales to future permission types without ambiguity.
- Reserved fields document forward-compatible names for future permissions.
- Level-based permissions allow finer-grained grants as new capabilities are added.

### Negative

- Operators using `KUBB_AGENT_ALLOW_*` env vars must migrate to `KUBB_PERMISSION_*` when upgrading.
- Reserved fields in the config type are silently ignored by the agent until enforced.
- OR merge semantics mean the config cannot restrict a permission that an env var grants.

## Considered options

**Option A: Env vars and CLI flags only (status quo)**

No config changes. Rejected because the config is not self-contained.

**Option B: Config only**

Env vars and CLI flags removed. Rejected because deployment-level overrides require granting permissions without editing the config file.

**Option C: Config + renamed env vars with OR semantics (chosen)**

Both surfaces exist. Config sets project intent; env vars set deployment-level grants.

**Option D: Nested under `agent.permissions`**

The field would be `config.agent.permissions`. Rejected because it adds nesting for no practical gain and the field is not exclusive to the agent.

## Related ADRs

- [ADR-0003](./0003_kubb_agent.md) — Kubb Agent architecture and security model
