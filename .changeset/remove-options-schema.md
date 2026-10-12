---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/cli': patch
---

Remove the options `schema` from `definePlugin`, with `PluginOptions`, `StandardSchemaV1`, `plugin.parsedOptions`, the `KUBB_INVALID_OPTIONS` diagnostic, and `@kubb/kit/options`. Type plugin options with TypeScript and apply their defaults in `setup`. `@kubb/kit` no longer depends on `zod`.
