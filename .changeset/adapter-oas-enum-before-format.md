---
'@kubb/adapter-oas': patch
---

Keep the values of an `enum` that also has a `format`, such as `type: integer, format: int32` with `x-enumNames`. These enums were generated as a plain `number` (or `z.int32()`) and now generate a literal union again, as in Kubb 4. With the default plugin-ts options, a schema named `Status` now exports its type as `StatusKey`, like every other enum, so code that imports `Status` must switch to `StatusKey`.

An enum without `type`, such as `{ enum: [0, 1] }`, is now treated like the same enum with `type: integer`.

An enum that holds `null`, such as `enum: [null, 0, 1]`, now keeps each `x-enumNames` and `x-enumDescriptions` entry with its own value.
