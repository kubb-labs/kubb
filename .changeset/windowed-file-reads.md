---
'@kubb/studio': minor
---

Add an optional `cursor` and `limit` to `readFiles`, so a caller can page through a large generated file. The reply carries only that page's lines plus `pages[path]` with the `nextCursor` (`null` after the last page) and the file's `totalLines`. Reads without a `limit` behave as before.
