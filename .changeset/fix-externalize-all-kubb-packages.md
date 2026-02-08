---
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
---

Externalize all @kubb/* packages in tsdown configs to prevent duplicate type declarations across packages, fixing TypeScript type incompatibility errors caused by inlined #private class fields.
