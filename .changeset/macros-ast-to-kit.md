---
'@kubb/ast': major
'@kubb/kit': minor
'@kubb/adapter-oas': patch
---

Move the macro presets from `@kubb/ast` to `@kubb/kit`, keeping the macro engine on `@kubb/ast`.

`defineMacro`, `composeMacros`, `applyMacros`, and the `Macro` type stay on the `@kubb/ast` root export. `macroDiscriminatorEnum`, `macroEnumName`, `macroRenameSchema`, and `macroSimplifyUnion` move to `@kubb/kit`, reached through `kubb/kit` like the rest of the plugin and adapter authoring surface. `@kubb/adapter-oas` now depends on `@kubb/kit` for these presets instead of `@kubb/ast`.

```diff
- import { macroSimplifyUnion } from '@kubb/ast'
+ import { macroSimplifyUnion } from '@kubb/kit'
```
