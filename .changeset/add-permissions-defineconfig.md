---
"@kubb/agent": minor
"@kubb/cli": patch
---

Add `permissions` to `kubb.config.ts` (via `@kubb/agent`) and adopt `KUBB_PERMISSION_*` env vars with level-based grants.

**`@kubb/agent`** — reads a `permissions` field from `kubb.config.ts` at startup. Permissions belong to the agent, not `@kubb/core`. Each permission accepts `'none'`, `'read'`, or `'write'`:

```ts
export default defineConfig({
  permissions: {
    filesystem: 'write',  // allow writing generated files to disk
  },
})
```

Permissions are merged from `kubb.config.ts` and env vars using the highest level from each source. Sandbox sessions always force all permissions to `'none'`.

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
