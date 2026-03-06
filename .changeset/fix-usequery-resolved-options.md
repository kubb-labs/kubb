---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-solid-query": patch
---

Fix user-provided query options (e.g. `enabled`) not being applied in generated hooks.

The local destructured variable `queryOptions` in generated hook code was shadowing the imported `queryOptions` function from TanStack Query. This caused options like `enabled: false` passed at the call site to be silently ignored in certain environments.

The fix renames the local variable to `resolvedOptions` and ensures user options are spread before the explicit `queryKey` in the query call, so call-site overrides are always respected.
