---
"@kubb/plugin-oas": patch
"@kubb/plugin-ts": patch
---

bugfix - boolean consts are no longer breaking TS plugin output, and will result in the correct zod output. Number 0 const will also stop breaking TS plugin output
