---
'@kubb/core': patch
---

`fsStorage` writes generated files on two worker threads, so the main thread keeps printing files while the disk catches up. The files on disk stay the same.
