---
'@kubb/adapter-oas': patch
---

Keep the values of an `enum` that also has a `format`, such as `type: integer, format: int32` with `x-enumNames`. These enums were generated as a plain `number` (or `z.int32()`) and now generate a literal union again, as in Kubb 4. The node still carries the `format`.
