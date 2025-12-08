---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
---

Fix `clientType: 'class'` compatibility with query plugins. Query plugins now automatically detect when `clientType: 'class'` is set and generate their own inline function-based clients, allowing class-based clients and query hooks to coexist in the same configuration.

Previously, when `@kubb/plugin-client` was configured with `clientType: 'class'`, query plugins would fail because they expected function-based clients but attempted to import non-existent class methods.
