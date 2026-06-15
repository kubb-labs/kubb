---
"@kubb/ast": major
"@kubb/core": major
"@kubb/adapter-oas": major
---

Add macros, a named and composable way to rewrite the AST, and make them the single transform layer.

`defineMacro`, `composeMacros`, and `applyMacros` live on the new `@kubb/ast/macros` subpath and turn an anonymous transform into a named unit with an optional `enforce` order and a `when` gate. Macros follow the `macro<Name>` convention, mirroring plugins (`pluginTs`). Plugins register them through the new `addMacro` and `setMacros` setup-context methods in `@kubb/core`, which compose a plugin's macros into a single pass over each node. The existing `setTransformer` keeps working as a thin wrapper that adds a bare visitor as one macro.

The schema rewriters are retired into macros. `setDiscriminatorEnum`, `simplifyUnion`, and `setEnumName` are removed from `@kubb/ast` and replaced by `macroDiscriminatorEnum`, `macroSimplifyUnion`, and `macroEnumName`. `mergeAdjacentObjects` and `syncSchemaRef` move to the `@kubb/ast/utils` subpath. `@kubb/adapter-oas` normalizes through these macros.
