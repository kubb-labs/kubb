---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'unplugin-kubb': patch
'kubb': patch
---

Replace `any` and unchecked object-literal `as Type` assertions with real types and type annotations, satisfying the new `typescript/no-explicit-any` and `typescript/consistent-type-assertions` oxlint rules. `createMockedAdapter` now returns a fully-shaped `Adapter` (including `document` and `validate`) instead of force-casting a partial object, and `KubbDriver` builds each plugin's default resolver inline instead of casting past the missing field.
