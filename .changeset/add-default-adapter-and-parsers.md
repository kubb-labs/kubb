---
"@kubb/core": minor
"kubb": minor
---

Apply default adapter and parsers automatically in `defineConfig`.

When omitted from the config:
- `adapter` defaults to `adapterOas()` from `@kubb/adapter-oas`
- `parsers` defaults to `[parserTs]` from `@kubb/parser-ts`

```ts
// before
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  adapter: adapterOas(),
  parsers: [parserTs],
  plugins: [],
})

// after — adapter and parsers applied automatically
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [],
})
```
