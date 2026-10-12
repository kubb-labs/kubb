---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/adapter-oas': patch
'@kubb/parser-ts': patch
'@kubb/parser-md': patch
---

`createAdapter` takes an object with `meta`, `setup`, and `build`, like `definePlugin`. Kubb checks the adapter's `meta.compatibility` too.

```ts
export const adapterGraphql = createAdapter<AdapterGraphql>({
  meta: { name: 'graphql', compatibility: { kubb: '>=5.8.0' } },
  setup: (options) => ({ ...options, scalars: options.scalars ?? {} }),
  build: (options) => ({ document: null, parse, validate }),
})
```

`defineParser` takes `build` in place of `setup`, and the parser exposes its `options`. The factory form of `createAdapter` and the parser `setup` key are deprecated.
