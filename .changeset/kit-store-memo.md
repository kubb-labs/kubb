---
'@kubb/core': minor
'@kubb/kit': minor
---

`memo` now also caches in a store you own: `memo(store, key, compute)` takes a `Map` or `WeakMap` and needs no build. `memo.create({ type: 'map' | 'weak' | 'last' })` creates a store, where `'last'` keeps only the last entry.
