---
"@kubb/core": major
"@kubb/adapter-oas": major
---

Rename factory functions from `define*` to `create*`.

| Before | After |
|---|---|
| `definePlugin` | `createPlugin` |
| `defineAdapter` | `createAdapter` |
| `defineGenerator` | `createGenerator` |
| `defineLogger` | `createLogger` |
| `defineStorage` | `createStorage` |

`defineConfig` remains unchanged.
