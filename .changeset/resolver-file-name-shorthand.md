---
'@kubb/core': major
---

Rename generated files through a resolver's `file: { name }` instead of the `resolveName` hook.

A resolver now sets file naming by supplying a base-name caser:

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

`file.name` receives the identifier and returns the file's base name, reaching sibling helpers through `this`, and is accepted the same way in a plugin `resolver` override and in `Resolver.merge`.

This replaces the previous approach of overriding `file(params, context)` and threading a `resolveName` function through `this.default.file`. The `file` function form and the `resolveName` field on `ResolverFileParams` are removed. Migrate by moving the caser into `file.name`:

```ts
// before
file(params, context) {
  return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
}

// after
file: {
  name(name) {
    return toFilePath(name, pascalCase)
  },
}
```
