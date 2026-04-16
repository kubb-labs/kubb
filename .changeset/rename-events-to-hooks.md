---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/agent': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

Rename `KubbEvents` to `KubbHooks`.

- `KubbEvents` is now `KubbHooks`
- `driver.hooks` is the primary emitter API
- `events` is kept as a deprecated alias for compatibility
