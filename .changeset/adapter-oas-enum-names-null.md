---
'@kubb/adapter-oas': patch
---

Keep each `x-enumNames` and `x-enumDescriptions` entry with its own value when the enum holds `null`, such as `enum: [null, 0, 1]`. Before, the names shifted by one and the last one was dropped.

An enum without `type`, such as `{ enum: [0, 1] }`, is now treated like the same enum with `type: integer`.
