---
"@kubb/cli": patch
"@kubb/core": patch
"kubb": patch
"@kubb/mcp": patch
"@kubb/oas": patch
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-oas": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-redoc": patch
"@kubb/plugin-solid-query": patch
"@kubb/plugin-svelte-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
"unplugin-kubb": patch
---

Updated tsdown from 0.18.4 to 0.19.0 and added `keepNames: true` in `outputOptions` for all packages. This preserves function and class names in bundled output, fixing React DevTools component inspection and improving debugging experience.
