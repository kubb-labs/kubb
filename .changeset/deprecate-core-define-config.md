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

Add the `output.barrel` object and `@deprecated` JSDoc warnings to prepare for v5.

`output.barrel` is the forward-compatible replacement for `output.barrelType`, available now on both the root config and each plugin's `output` so a config can migrate ahead of the v5 upgrade:

```ts
output: { barrelType: 'named' }                  // deprecated
output: { barrel: { type: 'named' } }            // root or plugin
output: { barrel: { type: 'named', nested: true } } // plugin only, replaces 'propagate'
output: { barrel: false }                         // disable
```

`@deprecated` hints were added where there is something to do in v4 today, each linking the [v5 migration guide](https://kubb.dev/docs/5.x/migration-guide):

- `defineConfig` from `@kubb/core` (import it from `kubb` instead). `kubb` now exports its own `defineConfig` so the deprecation does not leak through.
- `output.barrelType` (use `output.barrel`) and `output.override` (removed in v5).
- `generators`, `paramsType`, `pathParamsType`, `paramsCasing`, and `bundle` on the client and query plugins.
- `version` on `@kubb/plugin-zod` (always Zod v4 in v5).
- `@kubb/plugin-solid-query` and `@kubb/plugin-svelte-query`, which have no v5 equivalent.

Options whose only replacement is a v5-only API (the `resolver`/`macros`/`printer` plugin options and the schema options that move to `@kubb/adapter-oas`) are intentionally not deprecated yet, since there is no v4 alternative to point users at.
