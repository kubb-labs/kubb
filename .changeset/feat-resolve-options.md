---
"@kubb/ast": minor
"@kubb/core": minor
"@kubb/plugin-oas": minor
"@kubb/plugin-ts": patch
---

- Add `resolveOptions(node, context)` utility to `@kubb/ast/utils` — resolves the effective plugin options for an `OperationNode` or `SchemaNode` by applying `exclude`, `include`, and `override` rules. Returns `null` when the node is excluded or not matched by `include`.
- Add `resolveOptions?` to `PluginLifecycle` in `@kubb/core` alongside `resolvePath` and `resolveName`.
- Add `BySchemaName` to `Exclude` and `Include` filter types in `@kubb/plugin-oas` so schemas can now be excluded/included by name.
- Re-export `resolveOptions` from `@kubb/plugin-oas`.
- Implement `resolveOptions` in `plugin-ts`.
