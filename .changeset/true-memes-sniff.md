---
"@kubb/plugin-zod": patch
---

Fixes the issue where the `wrapOutput` function in the Zod generator did not receive the correct `schema` argument for all traversed nodes
