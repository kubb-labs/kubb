---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/parser-ts': minor
'@kubb/parser-md': minor
---

`definePlugin` and `defineParser` accept an object with `meta`. Plugins also take `dependencies` and `setup(options, kubb)`. The factory form and `name` are deprecated, and `name` is optional when `meta.name` is set.

Before:

```ts
export const pluginZod = definePlugin<PluginZod>((options) => ({
  name: 'plugin-zod',
  dependencies: ['plugin-ts'],
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.addGenerator(zodGenerator)
      ctx.setOptions({ ...options, inferred: options.inferred ?? false })
    },
  },
}))
```

After:

```ts
export const pluginZod = definePlugin<PluginZod>({
  meta: { name: 'plugin-zod', version: '5.7.0', compatibility: { kubb: '>=5.7.0' } },
  dependencies: { 'plugin-ts': { version: '>=5.0.0' } },
  setup(options, kubb) {
    kubb.addGenerator(zodGenerator)
    return { ...options, inferred: options.inferred ?? false }
  },
})
```

A mismatch in `meta.compatibility` or `dependencies` fails the run with `KUBB_INCOMPATIBLE_EXTENSION`, `KUBB_MISSING_DEPENDENCY`, or `KUBB_INCOMPATIBLE_DEPENDENCY`.
