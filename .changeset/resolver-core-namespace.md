---
"@kubb/core": minor
---

Group the built-in resolver helpers under `resolver.core` and replace the `default(name, type)` discriminator with dedicated per-kind helpers.

The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. Each kind now has its own helper on `core`:

- `resolver.core.name(name)` — runtime-value identifiers (was `default(name, 'function' | 'const')` and the type-less `default(name)`)
- `resolver.core.typeName(name)` — type identifiers (was `default(name, 'type')`)
- `resolver.core.fileName(name)` — file paths (was `default(name, 'file')`)

The other built-ins move alongside them: `resolver.core.options`, `resolver.core.path`, `resolver.core.file`, `resolver.core.banner`, and `resolver.core.footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`). Group your own naming methods into namespaces beside `core` and reach the shared helpers from any of them through `this.core` — the whole resolver is bound, so a nested namespace method still sees `this.core`.

```ts
export const resolverTs = defineResolver<PluginTs>(() => ({
  name: 'default',
  pluginName: 'plugin-ts',
  schema: {
    name(this: ResolverTs, name) {
      return this.core.name(name)
    },
    typeName(this: ResolverTs, name) {
      return this.core.typeName(name)
    },
  },
}))
```

`setResolver` and the new `mergeResolver(base, override)` export accept a deep partial, so an override can name a single helper (`{ core: { typeName } }`) without restating the rest.
