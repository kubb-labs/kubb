---
'@kubb/core': minor
'@kubb/kit': minor
'@kubb/adapter-oas': minor
'@kubb/parser-ts': minor
'@kubb/parser-md': patch
'@kubb/plugin-barrel': patch
---

`createAdapter` and `defineParser` take `meta` and an options `schema`, like `definePlugin`. Kubb checks the adapter's `meta.compatibility` too.

```ts
export const adapterGraphql = createAdapter<AdapterGraphql>({
  meta: { name: 'graphql', compatibility: { kubb: '>=5.8.0' } },
  schema: optionsSchema,
  setup: (options) => ({ ...options, scalars: options.scalars ?? {} }),
  build: (options) => ({ document: null, parse, validate }),
})
```

`defineParser` takes `build` in place of `setup`, and the parser exposes its parsed `options`. The factory form of `createAdapter` and the parser `setup` key are deprecated.

`adapterOas`, `parserTs`, and `parserTsx` now validate their options and throw `KUBB_INVALID_OPTIONS` for an invalid value. `pluginBarrel` lists the `output.barrel` option it adds in `meta.contributes`.
