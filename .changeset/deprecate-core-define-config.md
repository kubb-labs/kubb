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

Add the `output.barrel` object and `@deprecated` hints to prepare for v5.

`output.barrel` replaces `output.barrelType` and works now, on the root config and on each plugin's `output`, so you can move to the v5 barrel shape while still on v4:

```ts
output: { barrelType: 'named' }                     // deprecated
output: { barrel: { type: 'named' } }               // root or plugin
output: { barrel: { type: 'named', nested: true } } // plugin only, replaces 'propagate'
output: { barrel: false }                           // disable
```

The `@deprecated` hints only flag what you can act on in v4 today, and each links the [v5 migration guide](https://kubb.dev/docs/5.x/migration-guide):

- `defineConfig` from `@kubb/core`, now re-exported from `kubb`. Import it from `kubb` so the deprecation does not follow you.
- `output.barrelType` (use `output.barrel`) and `output.override` (gone in v5).
- `generators`, `paramsType`, `pathParamsType`, `paramsCasing`, and `bundle` on the client and query plugins.
- `version` on `@kubb/plugin-zod` (v5 always targets Zod v4).
- `@kubb/plugin-solid-query` and `@kubb/plugin-svelte-query`, which have no v5 equivalent.

When v4 already has the value that becomes fixed in v5, the message names it so you can set it early: `paramsCasing: 'camelcase'`, `paramsType: 'object'`, `bundle: true`, and `version: '4'`.

Options whose only replacement is a v5-only API stay untouched for now, since there is nothing to switch to in v4. That covers the `resolver`, `macros`, and `printer` plugin options and the schema options that move to `@kubb/adapter-oas`.
