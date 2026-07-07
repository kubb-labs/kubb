---
'@kubb/core': major
---

Resolve generated file names and paths through a resolver's `file` object instead of the `resolveName` hook.

`file.baseName` builds the base name (extension included) and `file.path`, when set, builds the full path:

```ts
createResolver({
  pluginName: 'plugin-faker',
  name(name) {
    return camelCase(name, { prefix: 'create' })
  },
  file: {
    // full base name including the extension; defaults to toFilePath(name) + extname
    baseName({ name, extname }) {
      return `${camelCase(name, { prefix: 'create' })}${extname}`
    },
    // full path, resolved against the project root, bypassing output.path and group
    path({ baseName, output }) {
      return `${output.path}/mocks/${baseName}`
    },
  },
})
```

`file.baseName` receives the identifier and the target `extname` and returns the complete base name. `file.path` receives that resolved `baseName` plus the active `output` and returns the complete path, resolved against the project root (it may not escape it). Both reach sibling helpers through `this`, and are accepted the same way in a plugin `resolver` override and in `Resolver.merge`.

This removes the `file(params, context)` override form and the `resolveName` field on `ResolverFileParams`. Migrate by moving the caser into `file.baseName`:

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

The file-resolution methods take a single options object now, and the `ResolverContext` type is removed (its `root`/`output`/`group` fold into each method's options):

```ts
// before
resolver.file({ name, extname: '.ts', tag, path }, { root, output, group })
// after
resolver.file({ name, extname: '.ts', tag, path, root, output, group })
```

`resolver.file`, `resolver.default.file`, and `resolver.default.path` now accept `ResolveFileOptions` / `ResolvePathOptions` instead of `(params, context)`.
