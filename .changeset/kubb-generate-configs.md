---
'@kubb/core': minor
'@kubb/cli': minor
'unplugin-kubb': minor
'@kubb/studio': minor
---

Add `Kubb.generate(configs)`, which builds every config of a `defineConfig([...])` array and keeps going when one fails. `kubb generate`, `kubb update`, `unplugin-kubb` and `kubb studio snapshot` now use it.
