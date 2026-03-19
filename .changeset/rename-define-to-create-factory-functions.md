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

Rename factory functions from `define*` to `create*` to align with Vite ecosystem conventions.

**Rule:** `define*` is reserved for pure identity/type helpers (no runtime behavior — removing the call doesn't change the value, only loses type inference). `create*` is used for functions that produce instances, wrap builders, or apply logic.

`defineConfig` is unchanged — it is a pure identity helper.

| Before | After |
|---|---|
| `definePlugin` | `createPlugin` |
| `defineAdapter` | `createAdapter` |
| `defineGenerator` | `createGenerator` |
| `defineLogger` | `createLogger` |
| `defineStorage` | `createStorage` |
