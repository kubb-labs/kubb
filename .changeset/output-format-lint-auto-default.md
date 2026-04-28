---
"kubb": minor
"unplugin-kubb": minor
"@kubb/core": patch
---

`output.format` and `output.lint` now default to `'auto'` instead of being disabled.

Both `defineConfig` (in the `kubb` package) and the `unplugin-kubb` factory now apply `'auto'` when neither field is explicitly set. With `'auto'`, Kubb detects the first available tool at runtime:

- **format**: oxfmt → biome → prettier (skips silently if none found)
- **lint**: oxlint → biome → eslint (skips silently if none found)

Set either field to `false` to opt out of the automatic behaviour:

```ts
export default defineConfig({
  output: {
    format: false,
    lint: false,
  },
})
```
