---
'@kubb/core': patch
---

Write generated files without a `mkdir` syscall each.

Every write created its parent directory first, so a spec writing 2000 files into one directory made 2000 of those calls, 1999 of which did nothing. Kubb now writes the file and only creates the directory when the write reports it is missing, which also recovers when something removed the directory mid-run.

Measured on 2000 generated files, medians of five runs alternating between the two builds: a cold build drops from 492ms to 427ms. A rebuild that writes nothing is unchanged.
