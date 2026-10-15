---
'@kubb/studio': patch
---

Send more with each `readDiff` page, so Studio can render diffs of any size. Each page now carries `stats` for the whole diff: additions, deletions, hunks, patch lines, and `coarse` when part of it fell back to one replace block. Each hunk carries its full header (`oldLines`, `newLines`), the unchanged lines before it (`collapsedBefore`), and `offset`. Pages now end on hunk boundaries, and a hunk is split only when it alone is longer than a page.
