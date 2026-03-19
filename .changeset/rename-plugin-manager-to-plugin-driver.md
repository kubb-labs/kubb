---
"@kubb/core": major
"@kubb/plugin-oas": major
"@kubb/plugin-ts": major
"@kubb/plugin-client": major
"@kubb/plugin-faker": major
"@kubb/plugin-zod": major
"@kubb/plugin-msw": major
"@kubb/plugin-swr": major
"@kubb/plugin-react-query": major
"@kubb/plugin-vue-query": major
"@kubb/plugin-svelte-query": major
"@kubb/plugin-solid-query": major
"@kubb/plugin-cypress": major
"@kubb/plugin-mcp": major
---

Rename `PluginManager` to `PluginDriver`. The `pluginManager` property in context/meta is now `driver`. The hook `usePluginManager` is now `usePluginDriver`.
