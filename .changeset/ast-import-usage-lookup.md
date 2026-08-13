---
'@kubb/ast': patch
---

Cut the cost of assembling one file out of many fragments.

`createFile` runs again on every merge into a file, and its import filter scanned the whole accumulated source once per import name. A file built from many fragments paid that scan again for every fragment it had already absorbed.

Usage now comes from the identifier runs collected in a single pass, which gives the same answer. Assembling 800 fragments drops from 2.0s to 0.9s and 1600 from 29.2s to 3.8s. Below about 200 fragments the two are level.
