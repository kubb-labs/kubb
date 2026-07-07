---
'@kubb/core': minor
---

Add a `file: { name }` shorthand to resolver definitions.

A resolver can now rename generated files by supplying just the base-name caser, instead of writing the full `file` override that threads `resolveName` through `this.default.file`:

```ts
createResolver({
  pluginName: 'plugin-faker',
  name(name) {
    return camelCase(name, { prefix: 'create' })
  },
  file: {
    name(name) {
      return camelCase(name, { prefix: 'create' })
    },
  },
})
```

`file.name` receives the identifier and returns the file's base name, reaching sibling helpers through `this`. The full `file(params, context)` function form still works for cases that need the path context. The same shorthand is accepted in a `resolver` override passed to a plugin and in `Resolver.merge`.
