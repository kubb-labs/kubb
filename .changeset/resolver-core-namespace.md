---
"@kubb/core": minor
---

Group the built-in resolver helpers under `resolver.core` and replace the `default(name, type)` discriminator with dedicated per-kind helpers.

The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. Naming now has two dedicated helpers on `core`:

- `resolver.core.name(name)` — the generated identifier casing (was `default(name)` / `default(name, 'function' | 'const' | 'type')`; a plugin sets its own convention, camelCase or PascalCase)
- `resolver.core.fileName(name)` — file paths (was `default(name, 'file')`)

The other built-ins move alongside them: `resolver.core.options`, `resolver.core.path`, `resolver.core.file`, `resolver.core.banner`, and `resolver.core.footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`). A plugin that names types differently from values adds its own method (for example `resolveTypeName`) alongside the built-ins and reaches the shared casing through `this.core`, since a method called on the resolver already has the resolver as `this`.

```ts
export const resolverTs = defineResolver<PluginTs>(() => ({
  name: 'default',
  pluginName: 'plugin-ts',
  resolveTypeName(name) {
    return `${this.core.name(name)}Type`
  },
}))
```

`setResolver` and the new `mergeResolver(base, override)` export accept a partial override that merges one level deep, so an override can name a single helper (`{ core: { name } }`) without restating the rest. `core.file` receives the assembled resolver as its first argument, so a custom file builder never needs `this`.
