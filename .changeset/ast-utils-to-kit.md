---
'@kubb/ast': major
'@kubb/kit': minor
'@kubb/adapter-oas': patch
---

Move the schema-name and schema-graph helpers `@kubb/ast` doesn't use internally to `@kubb/kit`.

`childName`, `enumPropName`, `extractRefName`, `isStringType`, `mergeAdjacentObjectsLazy`, `syncSchemaRef`, and `containsCircularRef` move to `@kubb/kit`, reached through `kubb/kit` like the macro presets. `resolveRefName`, `findCircularSchemas`, and `collectUsedSchemaNames` stay on `@kubb/ast` since its own node builders depend on them. `@kubb/ast` also now exports `collectLazy`'s replacement `collect` (see the companion changeset) so `containsCircularRef` can keep its early-exit behavior from `@kubb/kit`.

```diff
- import { childName, enumPropName, extractRefName, isStringType, syncSchemaRef, mergeAdjacentObjectsLazy, containsCircularRef } from '@kubb/ast'
+ import { childName, enumPropName, extractRefName, isStringType, syncSchemaRef, mergeAdjacentObjectsLazy, containsCircularRef } from '@kubb/kit'
```
