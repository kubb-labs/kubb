---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/plugin-barrel': minor
'unplugin-kubb': minor
'@kubb/studio': minor
---

Add `shared: { path }`. Schemas that several configs of a `defineConfig([...])` array define identically are written once under that path, and every other file imports them from there.
