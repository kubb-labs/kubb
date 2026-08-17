---
'@kubb/kit': minor
'@kubb/ast': patch
---

Settle the boundary between `@kubb/ast` and `@kubb/kit`.

`@kubb/ast` keeps the node tree, the `ast.factory` builders, and the macro engine (`defineMacro`, `composeMacros`, `applyMacros`). The macro presets (`macroDiscriminatorEnum`, `macroEnumName`, `macroRenameSchema`, `macroSimplifyUnion`) and the schema-name and schema-graph helpers that only `@kubb/adapter-oas` and plugins consume (`childName`, `enumPropName`, `extractRefName`, `isStringType`, `mergeAdjacentObjectsLazy`, `syncSchemaRef`, `containsCircularRef`) live on `@kubb/kit`, reached through `kubb/kit`:

```diff
- import { macroSimplifyUnion, childName, syncSchemaRef } from '@kubb/ast'
+ import { macroSimplifyUnion, childName, syncSchemaRef } from '@kubb/kit'
```

`resolveRefName`, `findCircularSchemas`, and `collectUsedSchemaNames` stay on `@kubb/ast`, since its own node builders depend on them.
