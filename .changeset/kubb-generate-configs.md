---
'@kubb/core': minor
'@kubb/cli': minor
'unplugin-kubb': minor
'@kubb/studio': minor
---

Add `Kubb.generate(configs)` and `Kubb.fromConfigs(configs)` to `@kubb/core`, and export the `Kubb` class. They build every config of a `defineConfig([...])` array with the schemas it shares, and a config that fails no longer stops the others. `kubb generate`, `kubb update`, `unplugin-kubb` and `kubb studio snapshot` now run through `Kubb.generate`, so `unplugin-kubb` builds the remaining configs before it fails the host build.
