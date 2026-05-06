# ADR-0004: Permissions in defineConfig and KUBB_PERMISSION_* env vars

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3246](https://github.com/kubb-labs/kubb/pull/3246) | 2026-05-06    |

## Context

ADR-0003 established three permission flags (`filesystem`, `publish`, `yolo`) that control what a connected Studio session may do on the operator's machine. Before this ADR, those flags were set only via env vars (`KUBB_AGENT_ALLOW_WRITE`, `KUBB_AGENT_ALLOW_PUBLISH`, `KUBB_AGENT_ALLOW_ALL`) or CLI flags.

Two problems emerged:

1. **Config is not self-contained.** Operators must pass `--allow-write` on every `kubb agent start` or set env vars in every deployment manifest. The intent is not visible in `kubb.config.ts`.
2. **The `KUBB_AGENT_ALLOW_*` namespace does not scale.** As the permission surface grows, adding more `KUBB_AGENT_ALLOW_*` variables ties permission semantics to one package and leaves no room for a consistent future vocabulary.

## Decision

Permissions can be set in two places and are merged with OR semantics at startup.

### `permissions` field in `defineConfig`

```ts
export default defineConfig({
  permissions: {
    filesystem: true,  // write generated files to disk
    publish: false,    // run publish commands
  },
})
```

| Field        | Env var                      | Status   | Description                             |
| ------------ | ---------------------------- | -------- | --------------------------------------- |
| `filesystem` | `KUBB_PERMISSION_FILESYSTEM` | Active   | Write generated files to disk           |
| `publish`    | `KUBB_PERMISSION_PUBLISH`    | Active   | Run publish commands (e.g. `npm publish`) |
| `network`    | `KUBB_PERMISSION_NETWORK`    | Reserved | Fetch API specs from remote URLs        |
| `run`        | `KUBB_PERMISSION_RUN`        | Reserved | Execute arbitrary shell commands        |
| `env`        | `KUBB_PERMISSION_ENV`        | Reserved | Read environment variables from the host |

Reserved fields are accepted by the type but not enforced yet.

### `KUBB_PERMISSION_*` env vars

The old `KUBB_AGENT_ALLOW_*` env vars are replaced:

| Old (removed)              | New                          |
| -------------------------- | ---------------------------- |
| `KUBB_AGENT_ALLOW_WRITE`   | `KUBB_PERMISSION_FILESYSTEM` |
| `KUBB_AGENT_ALLOW_ALL`     | `KUBB_PERMISSION_YOLO`       |
| `KUBB_AGENT_ALLOW_PUBLISH` | `KUBB_PERMISSION_PUBLISH`    |

### Merge semantics

```
filesystem = KUBB_PERMISSION_YOLO || KUBB_PERMISSION_FILESYSTEM || config.permissions?.filesystem
publish    = KUBB_PERMISSION_YOLO || KUBB_PERMISSION_PUBLISH    || config.permissions?.publish
```

Sandbox mode forces all permissions to `false` regardless of config or env (see ADR-0003).

## Rationale

Putting permissions in `kubb.config.ts` means the config is self-contained. Operators who always want filesystem writes enabled set it once in the file instead of passing a flag on every invocation.

`KUBB_PERMISSION_*` separates the _what_ (a permission) from the _who_ (the agent). As permissions are checked in other contexts (future middleware, CI runners), the env var name stays meaningful. Reserved names prevent naming conflicts when new permissions are added.

OR semantics treat permissions as capabilities, not restrictions. Either the config or an env var can grant a permission. Operators who need a deployment-level grant use env vars; operators who want the config to document intent use `permissions`.

## Consequences

### Positive

- `kubb.config.ts` fully describes the required capabilities without separate env var documentation.
- The `KUBB_PERMISSION_*` namespace scales to future permission types without ambiguity.
- Reserved fields let operators write forward-compatible configs today.

### Negative

- Operators using `KUBB_AGENT_ALLOW_*` env vars must migrate to `KUBB_PERMISSION_*` when upgrading.
- Reserved fields in the config type are silently ignored by the agent until enforced.
- OR merge semantics mean the config cannot restrict a permission that an env var grants.

## Considered options

**Option A: Env vars and CLI flags only (status quo)**

No config changes. Rejected because the config is not self-contained.

**Option B: Config only**

Env vars and CLI flags removed. Rejected because deployment-level overrides require being able to grant permissions without editing the config file.

**Option C: Config + renamed env vars with OR semantics (chosen)**

Both surfaces exist. Config sets project intent; env vars set deployment-level grants.

**Option D: Nested under `agent.permissions`**

The field would be `config.agent.permissions`. Rejected because it adds nesting for no practical gain and the field is not exclusive to the agent.

## Related ADRs

- [ADR-0003](./0003_kubb_agent.md) — Kubb Agent architecture and security model
