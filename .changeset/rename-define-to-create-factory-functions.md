---
"@kubb/core": major
"@kubb/adapter-oas": major
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
"@kubb/plugin-redoc": major
---

Rename factory functions from `define*` to `create*`. `defineConfig` is unchanged.

| Before | After |
|---|---|
| `definePlugin` | `createPlugin` |
| `defineAdapter` | `createAdapter` |
| `defineGenerator` | `createGenerator` |
| `defineLogger` | `createLogger` |
| `defineStorage` | `createStorage` |
