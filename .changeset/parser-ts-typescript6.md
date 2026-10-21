---
'@kubb/parser-ts': patch
---

Load the compiler API from `@typescript/typescript6`, so `print` keeps working next to TypeScript 7, which no longer exports it. Custom printers that build compiler nodes import `ts` from `@typescript/typescript6`.

```diff
- import ts from 'typescript'
+ import ts from '@typescript/typescript6'
```
