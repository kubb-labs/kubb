---
'@kubb/kit': patch
'@kubb/ast': patch
---

Follow schema references for `schemaName` entries in `include`, `exclude`, and `override`.

- `include` also generates the schemas the matched schemas reference.
- `exclude` also drops the schemas only the excluded schemas reference.
- `override` also applies to the schemas the matched schemas reference.

```diff
  include: [
    { type: 'schemaName', pattern: '^Pet$' },
-   { type: 'schemaName', pattern: '^Store$' }, // Pet references Store
  ],
```
