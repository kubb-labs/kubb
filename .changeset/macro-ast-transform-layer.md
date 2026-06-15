---
"@kubb/ast": major
"@kubb/core": major
"@kubb/adapter-oas": major
---

Add macros, a named and composable way to rewrite the AST, and make them the single transform layer.

`defineMacro`, `composeMacros`, and `applyMacros` live on the `@kubb/ast` root and turn an anonymous transform into a named unit with an optional `enforce` order and a `when` gate. Macros follow the `macro<Name>` convention, mirroring plugins (`pluginTs`). The built-in presets live on the new `@kubb/ast/macros` subpath, one file per macro. Plugins register macros through the new `addMacro` and `setMacros` setup-context methods in `@kubb/core`, replacing the old `setTransformer`.

The plugin `transformer?: Visitor` field is gone, and `createMockedPlugin` from `@kubb/core/mocks` takes `macros` instead of a `transformer` visitor.

The schema rewriters are retired into macros. `setDiscriminatorEnum`, `simplifyUnion`, and `setEnumName` are removed from `@kubb/ast` and replaced by `macroDiscriminatorEnum`, `macroSimplifyUnion`, and `macroEnumName` on `@kubb/ast/macros`. `mergeAdjacentObjects` and `syncSchemaRef` move to the `@kubb/ast/utils` subpath. `@kubb/adapter-oas` normalizes through these macros.
