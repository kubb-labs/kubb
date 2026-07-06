---
"@kubb/core": major
---

Replace the `default(name, type)` discriminator with a `resolver.default` namespace and top-level `name`/`file` entries. `createResolver` returns a `Resolver` class instance (same factory pattern as `createKubb`).

The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. The built-in machinery now lives under `resolver.default` — `name` (camelCase identifier casing), `file` (the `FileNode` builder), `options`, `path`, `banner`, and `footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`).

Generators call the two top-level entries, each of which defaults to its `default` counterpart:

- `resolver.name(name)` — the plugin's identifier casing. Override it to set a convention (PascalCase, a suffix, …).
- `resolver.file(params, context)` — builds a `FileNode`. Override it for custom file-name casing, threading a caser through `params.resolveName` (default `toFilePath`).

`resolver.default` is the built-in machinery and is not overridable — plugins delegate to it via `this.default.*` rather than replace it.

Add plugin-specific helpers as top-level methods (`typeName`, …) and/or grouped namespaces (`query`, `schema`, …). Every helper reaches shared machinery through `this.name`, `this.default`, and `this.file`.

```ts
export const resolverTs = createResolver<PluginTs>({
  pluginName: 'plugin-ts',
  name(name) {
    return ensureValidVarName(pascalCase(name))
  },
  typeName(name) {
    return `${this.name(name)}Type`
  },
  query: {
    keyName(node) {
      return `${this.name(node.operationId)}QueryKey`
    },
  },
})
```

`setResolver` accepts a partial override. The framework merges it over the plugin default through `Resolver.merge` (rebuild-on-merge so namespace `this` bindings stay correct).

`Filter` is exported for include/exclude/override rules; `Exclude` and `Include` are aliases of `Filter`.
