---
'@kubb/studio': patch
---

Diff large generated files in under a second instead of failing with "The two versions differ too much to diff". `readDiff` pages now include `stats` for the whole diff and end on hunk boundaries.
