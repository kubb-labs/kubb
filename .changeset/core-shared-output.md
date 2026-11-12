---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/plugin-barrel': minor
'unplugin-kubb': minor
---

Add `shared: { path }`. In a `defineConfig([...])` array, `kubb generate` and `unplugin-kubb` write the schemas that several specs define identically once under that path, and every other file imports them from there. Barrels re-export the shared schemas each config defines, and `output.clean`, `output.format` and `output.lint` cover the shared directory. A host that calls `createKubb` itself passes its configs to `detectSharedSchemas` and gives each build its entry as the `shared` option.
