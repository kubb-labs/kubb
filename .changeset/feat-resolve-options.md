---
"@kubb/ast": minor
"@kubb/plugin-oas": minor
"@kubb/plugin-ts": patch
---

- Add `resolveOptions(node, context)` to `@kubb/ast` — returns effective plugin options for a node after applying `exclude`, `include`, and `override` rules, or `null` when excluded.
- Add explicit `options` parameter to `buildOperations`, `buildOperation`, and `buildSchema` in `@kubb/plugin-oas`.
- `plugin-ts` now resolves options inline before each `buildSchema`/`buildOperation` call.
