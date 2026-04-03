---
"@kubb/core": minor
"kubb": minor
---

`UserConfig` now correctly marks `adapter` and `parsers` as optional properties.

`defineConfig` automatically applies defaults when these options are omitted:

- `adapter` defaults to `adapterOas()` from `@kubb/adapter-oas`
- `parsers` defaults to `[parserTs]` from `@kubb/parser-ts`

This means most projects no longer need to set `adapter` or `parsers` explicitly in their `kubb.config.ts`:

```ts
// before — had to set adapter and parsers explicitly
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  adapter: adapterOas(),
  parsers: [parserTs],
  plugins: [],
})

// after — adapter and parsers are applied automatically
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [],
})
```

`@kubb/adapter-oas` and `@kubb/parser-ts` must be installed for the defaults to work.
