---
"@kubb/core": minor
---

Replace the `default(name, type)` discriminator with a `resolver.default` namespace and top-level `name`/`file` entries.

The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. The built-in machinery now lives under `resolver.default` — `name` (camelCase identifier casing), `file` (the `FileNode` builder), `options`, `path`, `banner`, and `footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`).

Generators call the two top-level entries, each of which defaults to its `default` counterpart:

- `resolver.name(name)` — the plugin's identifier casing. Override it to set a convention (PascalCase, a suffix, …).
- `resolver.file(params, context)` — builds a `FileNode`. Override it for custom file-name casing, threading a caser through `params.resolveName` (default `toFilePath`).

Group a plugin's other naming methods into namespaces (`query`, `schema`, …); inside a namespace method `this` is the resolver, so `this.name`, `this.default`, and `this.file` all resolve.

```ts
export const resolverTs = defineResolver<PluginTs>(() => ({
  pluginName: 'plugin-ts',
  name(name) {
    return ensureValidVarName(pascalCase(name))
  },
  file(params, context) {
    return this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)
  },
  query: {
    keyName(node) {
      return `${this.name(node.operationId)}QueryKey`
    },
  },
}))
```

`setResolver` and `mergeResolver(base, override)` accept a partial override that merges one level deep, so an override can name a single member (`{ name }`, `{ default: { path } }`) without restating the rest. The base `Resolver` no longer carries a `name` string field — `name` is the top-level casing method.
