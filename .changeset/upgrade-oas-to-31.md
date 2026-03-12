---
"@kubb/oas": patch
---

Upgrade `oas` to `^31.1.2` and `oas-normalize` to `^16.0.2`. Updated `getParametersSchema()` to resolve `$ref` parameters directly since oas v31 now filters them out in `getParameters()`.
