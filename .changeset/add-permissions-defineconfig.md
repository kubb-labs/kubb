---
"@kubb/core": minor
"@kubb/agent": patch
"@kubb/cli": patch
---

Add `permissions` to `defineConfig` and adopt `KUBB_PERMISSION_*` env vars.

**`@kubb/core`** — new optional `permissions` field on `Config`:

```ts
export default defineConfig({
  permissions: {
    filesystem: true,  // allow writing generated files to disk
    publish: false,    // allow running publish commands
  },
})
```

**`@kubb/agent`** — permissions are merged from `kubb.config.ts` and env vars at startup (OR semantics). Sandbox sessions always force all permissions to `false`.

**`@kubb/cli`** — new CLI flags replace the old ones:

| Old | New |
|-----|-----|
| `--allow-write` | `--permission.filesystem` |
| `--allow-all` | `--permission.yolo` |
| `--allow-publish` | `--permission.publish` |

**Breaking:** `KUBB_AGENT_ALLOW_*` env vars are removed. Use `KUBB_PERMISSION_*` instead:

| Old (removed) | New |
|---------------|-----|
| `KUBB_AGENT_ALLOW_WRITE` | `KUBB_PERMISSION_FILESYSTEM` |
| `KUBB_AGENT_ALLOW_ALL` | `KUBB_PERMISSION_YOLO` |
| `KUBB_AGENT_ALLOW_PUBLISH` | `KUBB_PERMISSION_PUBLISH` |
