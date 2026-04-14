---
'@kubb/core': minor
'@kubb/cli': patch
'@kubb/plugin-oas': patch
'@kubb/agent': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

Rename `KubbEvents` to `KubbHooks` and adopt `hooks` as the preferred emitter field.

- `KubbEvents` is now `KubbHooks` in `@kubb/core`.
- `driver.hooks` is now the primary emitter API (`driver.events` remains as a deprecated alias).
- Build/setup options now prefer `hooks` (`events` is kept as a deprecated alias for compatibility).
