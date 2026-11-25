---
'@kubb/kit': patch
---

Generate the schemas a `schemaName` entry in `include` references, so the generated imports resolve.

```diff
  include: [
    { type: 'schemaName', pattern: '^Pet$' },
-   { type: 'schemaName', pattern: '^Store$' }, // Pet references Store
  ],
```
