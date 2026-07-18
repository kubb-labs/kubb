---
'@kubb/core': patch
---

Avoid re-sorting the full `FileManager#files` set on every read.

Files added or updated since the last read are merged into the cached sorted view instead of triggering a full re-sort, so a large build no longer pays repeated `O(n log n)` sorts across `kubb:plugin:end`, `kubb:plugins:end`, and `kubb:build:end`. Output order is unchanged.
