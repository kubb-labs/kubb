---
"@kubb/core": minor
"@kubb/agent": patch
"@kubb/cli": patch
---

Add `permissions` to `defineConfig` and adopt `KUBB_PERMISSION_*` env vars with level-based grants.

**`@kubb/core`** — new optional `permissions` field on `Config`. Each permission accepts `'none'`, `'read'`, or `'write'`:

```ts
export default defineConfig({
  permissions: {
    filesystem: 'write',  // allow writing generated files to disk
  },
})
```

**`@kubb/agent`** — permissions are merged from `kubb.config.ts` and env vars at startup using the highest level from each source. Sandbox sessions always force all permissions to `'none'`.

**`@kubb/cli`** — new CLI flags replace the old ones:

| Old | New |
|-----|-----|
| `--allow-write` | `--permission.filesystem` |
| `--allow-all` | `--permission.yolo` |

**Breaking:** `KUBB_AGENT_ALLOW_*` env vars are removed. Use `KUBB_PERMISSION_*` instead:

| Old (removed) | New |
|---------------|-----|
| `KUBB_AGENT_ALLOW_WRITE` | `KUBB_PERMISSION_FILESYSTEM` |
| `KUBB_AGENT_ALLOW_ALL` | `KUBB_PERMISSION_YOLO` |

Env vars accept `"write"`, `"read"`, `"none"`, or `"true"` (treated as `"write"`).
