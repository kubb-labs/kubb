---
'@kubb/ast': major
---

Strip self-imports in `createFile`. An import whose resolved path equals the containing file is now dropped, so consolidated output (`output.mode: 'group'` and `output.mode: 'file'`) no longer emits an import that points at the file itself. Bare module specifiers and genuine cross-file imports are unaffected.
