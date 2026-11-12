---
'@kubb/cli': patch
'@kubb/mcp': patch
'unplugin-kubb': patch
---

The first load of an ES module `kubb.config.*` tries Node's own `import()` through jiti's `tryNative` before jiti transpiles it. CommonJS configs and reloads load as before. On a machine where jiti's transform cache is cold, such as CI, a run is about 145 ms faster.
