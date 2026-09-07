---
'@kubb/studio': patch
'@kubb/cli': patch
---

Space out `kubb studio` log output with blank lines between setup, connection, and each
command round trip, so the terminal reads as separate blocks instead of one dense run.
