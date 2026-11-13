---
'@kubb/core': minor
'@kubb/kit': minor
---

`memo.create({ max })` creates a bounded store: it empties itself before the entry that would pass `max`, so a cache in a long-running process cannot grow without end. `max: 1` keeps only the last entry.
