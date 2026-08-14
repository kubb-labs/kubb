---
'@kubb/ast': patch
---

Cut the cost of assembling one file out of many fragments.

`createFile` runs again on every merge into a file, and its import filter scanned the whole accumulated source once per import name. A file built from many fragments paid that scan again for every fragment it had already absorbed.

A file carrying more than 256 import names now indexes the source once and answers from the index, which gives the same result. Smaller files stay on the plain scan, so the default one file per operation is untouched. Assembling 800 fragments drops from 2.5s to 1.4s, and 1600 from 32.4s to 5.8s.
