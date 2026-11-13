---
'@kubb/core': minor
'@kubb/kit': minor
---

`memo.create({ type: 'map', limit })` creates a bounded store: it empties itself before the entry that would pass `limit`, so a cache in a long-running process cannot grow without end.
