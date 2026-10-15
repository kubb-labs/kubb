---
'@kubb/studio': patch
---

Diff large generated files fast enough to show them. The agent now splits each file on lines that occur once in both versions, and diffs the regions between them. A 50,000-line file with 3,000 changes takes about 0.3 seconds instead of 7. Previously, large specs returned "The two versions differ too much to diff". A region that still takes over a second shows as one replace block.
