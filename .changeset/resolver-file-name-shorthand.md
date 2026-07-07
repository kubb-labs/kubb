---
'@kubb/core': major
---

Rename and relocate generated files through a resolver's `file` object instead of the `resolveName` hook.

A resolver sets file naming with `file.name` and, optionally, the full path with `file.path`:

```ts
createResolver({
  pluginName: 'plugin-faker',
  name(name) {
    return camelCase(name, { prefix: 'create' })
  },
  file: {
    // base name (without extension); defaults to `toFilePath`
    name(name) {
      return camelCase(name, { prefix: 'create' })
    },
    // full path, resolved against the project root, bypassing `output.path` and `group`
    path({ name, output }) {
      return `${output.path}/mocks/${name}.ts`
    },
  },
})
```

`file.name` receives the identifier and returns the base name. `file.path` receives a single object (the file params merged with the resolver context) and returns the complete path (it may not escape the project root). Both reach sibling helpers through `this`, and are accepted the same way in a plugin `resolver` override and in `Resolver.merge`.

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
