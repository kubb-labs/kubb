---
'@kubb/cli': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

Load `kubb.config.*` with Node's own `import()` or `require()` when Node can run the file as is, and keep jiti for everything else: `.tsx` configs, an `enum`, a tsconfig `paths` alias, a relative import without its extension, and any reload in the same process. Under Bun, Bun's own `import()` loads every config except `.tsx`. jiti now loads only when a config needs it. On a machine where jiti's transform cache is cold, such as CI, a run is about 150 ms faster.
