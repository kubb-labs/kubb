---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
'@kubb/plugin-barrel': patch
'@kubb/adapter-oas': patch
'@kubb/cli': patch
---

Remove exports that nothing in Kubb or the official plugins used, and trim the code behind the rest. Generated output does not change.

- Remove `ast.forEachChild`, `ast.forEachSchema`, `ast.composeMacros`, `ast.isVirtualFile`, `ast.findCircularSchemasFromGraph`, and the `ParentOf` type. `VisitorContext` is now `{ parent?: Node }`. Use `ast.collect` to walk nodes and `ast.applyMacros` to run macros.
- Remove `macroRenameSchema` from `kubb/kit`. The macros guide shows its source to copy into your project.
- Remove TypeScript compiler-node printing from `@kubb/parser-ts` and its `TsNode` type. A printer handler that still returns a compiler node now throws; return a string.
- Remove `Hookable.setMaxListeners` and the `KubbInfoContext`, `KubbSuccessContext`, and `KubbWarnContext` aliases of `KubbMessageContext`.
