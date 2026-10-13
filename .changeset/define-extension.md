---
'@kubb/core': patch
'@kubb/kit': patch
---

Add `defineExtension` to define a plugin, an adapter, or a parser, and deprecate `definePlugin`, `defineParser`, and `createAdapter` in favor of it.

- Set `kind` to `'plugin'`, `'adapter'`, or `'parser'`. The rest of the object is the same as before, except that a parser takes `build`. `defineParser` still accepts the deprecated `setup` alias, but `defineExtension` does not.
- Export `defineExtension` from `@kubb/core` and `@kubb/kit`.
- Keep `definePlugin`, `defineParser`, and `createAdapter` working, now marked `@deprecated`.

```ts
// Before
export const pluginZod = definePlugin<PluginZod>({
  meta: { name: 'plugin-zod' },
  setup(options, kubb) {
    kubb.addGenerator(zodGenerator)
    return options
  },
})

// After
export const pluginZod = defineExtension<PluginZod>({
  kind: 'plugin',
  meta: { name: 'plugin-zod' },
  setup(options, kubb) {
    kubb.addGenerator(zodGenerator)
    return options
  },
})
```
