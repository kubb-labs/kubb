---
"@kubb/plugin-react-query": patch
"@kubb/plugin-solid-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-mcp": patch
---

Fix `buildFormData` being generated twice in `config.ts` when using `pluginClient` alongside query plugins. Skip adding `config.ts` when `plugin-client` is already present since it already adds the file.
