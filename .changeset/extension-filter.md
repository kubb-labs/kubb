---
'@kubb/core': minor
---

Filter operations by vendor extension. `include`, `exclude`, and `override` accept `{ type: 'extension', key: 'x-…', value? }`, which matches `OperationNode.extensions`: the key must be present and, when `value` is given, strictly equal to it. Schemas are not matched, like `tag`.
