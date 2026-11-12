---
'@kubb/core': patch
'@kubb/cli': patch
'unplugin-kubb': patch
'@kubb/studio': patch
---

Add `Kubb.generate(configs)`, which builds every config of a `defineConfig([...])` array and keeps going when one fails. `kubb generate`, `kubb update`, `unplugin-kubb` and `kubb studio snapshot` now use it.
