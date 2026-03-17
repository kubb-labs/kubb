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

Remove `pluginKey` in favour of `pluginName`. Each plugin can now only be used once, adding duplicate plugins throws an error.
