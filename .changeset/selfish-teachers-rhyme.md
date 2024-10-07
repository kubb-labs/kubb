---
"@kubb/plugin-zod": patch
---

Discard `optional()` if there is a `default()` to ensure the output type is not `T | undefined`
