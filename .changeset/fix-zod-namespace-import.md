---
"@kubb/plugin-zod": patch
---

Fix zod import to use namespace import (`import * as z from 'zod'`) for better compatibility with different module systems and bundlers.
