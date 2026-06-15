---
"@kubb/ast": minor
"@kubb/core": minor
---

Add macros, a named and composable way to rewrite the AST.

`defineMacro`, `composeMacros`, and `applyMacros` in `@kubb/ast` turn an anonymous transform into a named unit with an optional `enforce` order and a `when` gate. Macros follow the `macro<Name>` convention, mirroring plugins (`pluginTs`). Plugins register them through the new `addMacro` and `setMacros` setup-context methods in `@kubb/core`, which compose a plugin's macros into a single pass over each node. The existing `setTransformer` keeps working as a thin wrapper that adds a bare visitor as one macro.
