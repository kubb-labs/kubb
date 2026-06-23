---
'@kubb/plugin-zod': patch
---

Fix invalid Zod output when a nullable schema sits inside an `allOf`.

A nullable member of an `allOf` was treated as an intersection member, so its `nullable` keyword leaked into the `.and()` chain and produced invalid syntax like `z.lazy(() => nullableStringSchema).and(.nullable())`. Modifier keywords (`nullable`, `nullish`, `optional`, `default`, `describe`) are now lifted out of the intersection and wrap the whole schema instead, emitting `z.lazy(() => nullableStringSchema).nullable()`.
