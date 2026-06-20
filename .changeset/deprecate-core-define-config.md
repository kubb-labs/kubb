---
"@kubb/core": minor
"kubb": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-oas": minor
"@kubb/plugin-solid-query": minor
"@kubb/plugin-svelte-query": minor
---

Add `@deprecated` JSDoc warnings to options and exports that change in v5, so editors surface what to migrate ahead of the upgrade. Nothing is removed or behaves differently yet, these are documentation-only hints pointing at the [v5 migration guide](https://kubb.dev/docs/5.x/migration-guide).

- `defineConfig` from `@kubb/core` is deprecated in favor of importing it from `kubb`. The `kubb` package now exports its own `defineConfig` so the deprecation does not leak through to consumers importing from `kubb`.
- `output.barrelType` (use `output.barrel`) and `output.override` (removed) on the core config.
- The schema options `dateType`, `integerType`, `unknownType`, `emptySchemaType`, `enumSuffix`, and `contentType` that move to `adapterOas()`.
- `transformers` (use `resolver` and `macros`), `mapper` (use `printer` or `macros`), and `generators` (build your own plugin).
- `paramsType`, `pathParamsType`, `paramsCasing`, and `bundle` on the client and query plugins.
- `version` on `@kubb/plugin-zod` (always Zod v4 in v5).
- `serverIndex`, `serverVariables`, and `discriminator` on `@kubb/plugin-oas`, which is replaced by `@kubb/adapter-oas`.
- `@kubb/plugin-solid-query` and `@kubb/plugin-svelte-query`, which have no v5 equivalent.

```ts
import { defineConfig } from '@kubb/core' // deprecated
import { defineConfig } from 'kubb' // recommended
```
