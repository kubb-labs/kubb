---
'@kubb/studio': patch
'@kubb/cli': patch
---

`kubb studio snapshot` now publishes every entry of a `defineConfig([...])` array in one package. `createSnapshot` takes `configs` in place of `config`.
