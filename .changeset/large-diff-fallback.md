---
'@kubb/studio': patch
---

Diff large generated files fast enough to show them. The agent now cuts each file on unchanged stretches, found through lines that occur once in both versions, and diffs each segment on its own with `structuredPatch`. A 50,000-line file with 3,000 changes takes about 0.25 seconds instead of 7. A segment that still takes over a second shows as one replace block, instead of the error "The two versions differ too much to diff".
