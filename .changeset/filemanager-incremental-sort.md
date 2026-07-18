---
'@kubb/core': patch
---

Avoid re-sorting the full `FileManager#files` set on every read.

Files added or updated since the last read merge into the cached sorted view instead of forcing a full re-sort. A large build no longer pays a repeated `O(n log n)` sort at `kubb:plugin:end`, `kubb:plugins:end`, and `kubb:build:end`. Output order is unchanged.
