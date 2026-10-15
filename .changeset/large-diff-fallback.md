---
'@kubb/studio': patch
---

Diff large generated files fast enough to show them. The agent now cuts each file on unchanged stretches, found through lines that occur once in both versions, and diffs each segment on its own with `structuredPatch`. A 50,000-line file with 3,000 changes takes about 0.25 seconds instead of 7. A segment that still takes over a second shows as one replace block, instead of the error "The two versions differ too much to diff".

Each `readDiff` page also carries `stats` for the whole diff (additions, deletions, hunks, patch lines, and `coarse` when a replace block was used) and each hunk's full header. Pages end on hunk boundaries, and a hunk is split only when it alone is longer than a page.
