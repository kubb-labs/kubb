---
'@kubb/adapter-oas': patch
---

Drop enum values that break the schema's `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` or `multipleOf`, so `{ type: integer, enum: [0, 1], minimum: 1 }` generates `1` instead of `0 | 1`. The matching `x-enumNames` and `x-enumDescriptions` entries are dropped with them.
