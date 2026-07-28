---
"@kubb/adapter-oas": minor
---

Add support for `uint64` format alongside existing `int64` handling.

`uint64` is now recognized as a handled format like `int64`. When `integerType: "bigint"` (the default), `uint64` maps to `bigint`; when `integerType: "number"`, it maps to `integer`.
