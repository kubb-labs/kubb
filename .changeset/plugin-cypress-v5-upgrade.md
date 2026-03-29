---
"@kubb/plugin-cypress": major
---

Upgrade `@kubb/plugin-cypress` to v5 architecture.

- Replaces `@kubb/plugin-oas` / `@kubb/oas` with `@kubb/ast` + `@kubb/core` — no more OAS hook coupling
- Uses `defineGenerator` with `type: 'react'` instead of `createReactGenerator`
- Generator receives `{ node, adapter, options, config, driver, resolver }` props
- Cross-plugin TS file path resolved via `driver.getPlugin(pluginTsName)?.resolver.resolveFile(...)`
- Component `Request` receives `resolver: ResolverTs` directly; uses `createOperationParams` from `@kubb/ast` for typed function signatures, printed by `functionPrinter` from `@kubb/plugin-ts`
- `paramsCasing` now consistently applied to path, query, and header parameters (including `qs` and `headers` key remapping when param names are renamed)
- Adds `compatibilityPreset`, `resolvers`, `transformers`, and `generators` options
- Test helpers updated to use `createOperation`, `createParameter`, `createResponse`, `createSchema` from `@kubb/ast`
