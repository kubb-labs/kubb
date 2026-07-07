---
'@kubb/core': major
---

Rename and relocate generated files through a resolver's `file` object instead of the `resolveName` hook.

A resolver sets file naming with `file.baseName` and, optionally, the full path with `file.path`:

```ts
createResolver({
  pluginName: 'plugin-faker',
  name(name) {
    return camelCase(name, { prefix: 'create' })
  },
  file: {
    // full base name including the extension; defaults to `toFilePath(name)` + extname
    baseName({ name, extname }) {
      return `${camelCase(name, { prefix: 'create' })}${extname}`
    },
    // full path, resolved against the project root, bypassing `output.path` and `group`
    path({ name, output }) {
      return `${output.path}/mocks/${name}.ts`
    },
  },
})
```

`file.baseName` receives the identifier and target `extname` and returns the complete base name, extension included. `file.path` receives a single object (that resolved `baseName` plus the active `output`) and returns the complete path, resolved against the project root (it may not escape it). Both reach sibling helpers through `this`, and are accepted the same way in a plugin `resolver` override and in `Resolver.merge`.

This replaces the previous approach of overriding `file(params, context)` and threading a `resolveName` function through `this.default.file`. The `file` function form and the `resolveName` field on `ResolverFileParams` are removed. Migrate by moving the caser into `file.baseName`:

```ts
// before
file(params, context) {
  return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
}

// after
file: {
  baseName({ name, extname }) {
    return `${toFilePath(name, pascalCase)}${extname}`
  },
}
```

The file-resolution methods also take a single options object now, and the `ResolverContext` type is removed (its `root`/`output`/`group` fold into each method's options):

```ts
// before
resolver.file({ name, extname: '.ts', tag, path }, { root, output, group })
// after
resolver.file({ name, extname: '.ts', tag, path, root, output, group })
```

`resolver.file`, `resolver.default.file`, and `resolver.default.path` now accept `ResolveFileOptions` / `ResolvePathOptions` (a merge of the file request and where the output goes) instead of `(params, context)`.

