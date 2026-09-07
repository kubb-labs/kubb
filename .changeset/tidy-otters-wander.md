---
'@kubb/studio': patch
---

Fixes saving a config written as a factory with a block body:

```ts
export default defineConfig(() => {
  return { plugins: [pluginTs()] }
})
```

This used to fail with `config is not an object literal`. The patcher now reads and writes the
parsed AST instead of magicast's proxies, which also fixes configs magicast can't proxy at all
(`defineConfig(isCI ? a : b)`, a template literal) throwing instead of returning a reason.

The `connected` payload now carries the config file at `config.file` instead of a separate
top-level `configFile`.
