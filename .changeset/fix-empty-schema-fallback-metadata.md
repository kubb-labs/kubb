---
'@kubb/adapter-oas': patch
---

Preserve metadata (`deprecated`, `nullable`, `readOnly`, `writeOnly`, `default`, `examples`) on schemas without explicit `type` when falling back to `emptySchemaType`.
