---
'@kubb/core': minor
'@kubb/kit': minor
---

`memo` now also caches in a store you own: `memo(store, key, compute)` takes a `Map` or `WeakMap` and needs no build. `memo.create()` creates a store, and `memo.create({ weak: true })` one that frees an entry with its key.
