---
'@kubb/studio': minor
'@kubb/cli': minor
---

`kubb studio snapshot` now generates every entry of a `defineConfig([...])` array and packs their output into the one package. It used to publish the first entry only. `createSnapshot` takes `configs` in place of `config`.
