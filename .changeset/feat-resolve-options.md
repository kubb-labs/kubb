---
"@kubb/ast": minor
"@kubb/plugin-oas": minor
"@kubb/plugin-ts": patch
---

- Add `resolveOptions(node, context)` utility to `@kubb/ast` — resolves the effective plugin options for an `OperationNode` or `SchemaNode` by applying `exclude`, `include`, and `override` rules. Returns `null` when the node is excluded or not matched by `include`.
- Add explicit `options` parameter to `buildOperations`, `buildOperation`, and `buildSchema` in `@kubb/plugin-oas` so callers pass pre-resolved options instead of relying on `plugin.options` directly.
- `plugin-ts` now calls `resolveOptions` from `@kubb/ast` inline before each `buildSchema`/`buildOperation` call and correctly awaits generators with `Promise.all`.
