---
"@kubb/adapter-oas": patch
---

Numbers with a `format` such as `double`, `float` or `int32` keep their `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` and `multipleOf` constraints, so `{ type: 'number', format: 'double', minimum: -90, maximum: 90 }` generates `z.number().min(-90).max(90)` again. `int64` and `uint64` now keep `multipleOf` as well.
