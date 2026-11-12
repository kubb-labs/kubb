---
'@kubb/core': patch
---

`kubb generate` writes and compares output files faster: it reads a stored file synchronously, skips the read for a file that is not on disk, and writes through the callback `fs` API instead of `fs/promises`. The files on disk stay the same.
