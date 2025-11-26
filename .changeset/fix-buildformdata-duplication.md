---
'@kubb/plugin-react-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-mcp': patch
---

Fix `buildFormData` being generated twice in config.ts when using query plugins together with plugin-client. Query plugins now check for plugin-client presence before adding config.ts file to avoid duplication.
