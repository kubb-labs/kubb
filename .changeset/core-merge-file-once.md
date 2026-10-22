---
'@kubb/core': patch
---

Speed up builds that write many schemas into one file (`output.mode: 'file'`). Generator results for a file are now merged once when the files are read, not re-normalized on every schema. On a 1.9 MB spec with `@kubb/plugin-ts` writing a single file, the build drops from 3.3 s to 2.3 s and allocates about 600 MB less.

Named imports in such a file can come out in a different order, sorted by the fragments' names instead of following generation order. The imported names stay the same.
