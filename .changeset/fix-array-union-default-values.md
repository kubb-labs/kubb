---
"@kubb/oas": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-solid-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-client": patch
---

Fixed QueryKey and client function default values for array and union request body types. Previously, generated functions incorrectly used `= {}` as the default value for all optional parameters, causing TypeScript error TS2322 when the schema type was an array or a union with required fields. Now uses type-aware defaults: `[]` for arrays, `{}` for objects, and no default for unions without all-optional variants.

Added shared `getDefaultValue()` utility function to `@kubb/oas` to determine appropriate default values based on schema type, eliminating code duplication across plugins.
