---
'@kubb/adapter-oas': patch
---

Keep the values of an `enum` that also has a `format`, such as `type: integer, format: int32`. These enums generated as a plain `number` (or `z.int32()`) and now generate a union of their values, such as `0 | 1 | 2`, under the same type name. Enums whose format prints as `Date`, `bigint` or `Blob` are unchanged.

Keep each `x-enumNames` and `x-enumDescriptions` entry with its own value when the enum holds `null`, such as `enum: [null, 0, 1]`. Before, the names shifted by one and the last one was dropped.
