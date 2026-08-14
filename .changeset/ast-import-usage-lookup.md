---
'@kubb/ast': patch
---

Cut the cost of assembling one file out of many fragments.

`createFile` runs again on every merge into a file, and its import filter scanned the whole accumulated source once per import name. A file built from many fragments paid that scan again for every fragment it had already absorbed.

A file that asks about more than 32 names now indexes the source once and answers from that instead, which gives the same result. Files under that stay on the plain scan, so the default one-file-per-operation output is untouched. Assembling 800 fragments drops from 2.0s to 1.0s and 1600 from 29.2s to 4.0s.
