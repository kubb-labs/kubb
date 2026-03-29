---
"@kubb/core": minor
"@kubb/plugin-ts": patch
"@kubb/plugin-cypress": patch
---

### `@kubb/core`

Add three generic helper functions to `renderNode.tsx` that encapsulate the repeated react + core generator dispatch boilerplate:

- `runGeneratorSchema(node, ctx)` — dispatches a single schema node to all generators (react + core), resolving and null-checking options per generator.
- `runGeneratorOperation(node, ctx)` — dispatches a single operation node to all generators (react + core), resolving and null-checking options per generator.
- `runGeneratorOperations(nodes, ctx)` — batch-dispatches a list of collected operation nodes to all generators using `plugin.options` directly (no per-node filtering).

All three accept a shared `RunGeneratorContext<TOptions>` and are exported from `@kubb/core`.

### `@kubb/plugin-ts` / `@kubb/plugin-cypress`

Refactored `install()` to use the new `runGeneratorSchema`, `runGeneratorOperation`, and `runGeneratorOperations` helpers from `@kubb/core`, eliminating the repeated resolve → null-check → dispatch boilerplate. Both `schema` and `operation` lifecycles now support both `react` and `core` generators.
