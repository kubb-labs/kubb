---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/plugin-barrel': minor
---

Add `output.shared: { path }`. In a `defineConfig([...])` array, `kubb generate` writes the schemas that several specs define identically once under that path, and every other file imports them from there. Barrels re-export the shared schemas each config defines.
