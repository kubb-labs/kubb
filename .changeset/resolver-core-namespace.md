---
"@kubb/core": minor
---

Group the built-in resolver helpers under `resolver.core` and replace the `default(name, type)` discriminator with dedicated per-kind helpers.

The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. Naming now has two dedicated helpers on `core`:

- `resolver.core.name(name)` — the generated identifier casing (was `default(name)` / `default(name, 'function' | 'const' | 'type')`; a plugin sets its own convention, camelCase or PascalCase)
- `resolver.core.fileName(name)` — file paths (was `default(name, 'file')`)

The other built-ins move alongside them: `resolver.core.options`, `resolver.core.path`, `resolver.core.file`, `resolver.core.banner`, and `resolver.core.footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`). A plugin that names types differently from values adds its own method (for example `resolveTypeName`) in a namespace beside `core`, reaching the shared casing through `this.core`. The whole resolver is bound, so a nested namespace method still sees `this.core`.

```ts
export const resolverTs = defineResolver<PluginTs>(() => ({
  name: 'default',
  pluginName: 'plugin-ts',
  schema: {
    name(this: ResolverTs, name) {
      return this.core.name(name)
    },
    typeName(this: ResolverTs, name) {
      return `${this.core.name(name)}Type`
    },
  },
}))
```

`setResolver` and the new `mergeResolver(base, override)` export accept a deep partial, so an override can name a single helper (`{ core: { name } }`) without restating the rest.
