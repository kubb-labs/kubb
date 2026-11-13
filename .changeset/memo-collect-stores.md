---
'@kubb/core': minor
'@kubb/kit': minor
---

`memo.create({ collect: 'list' })` and `memo.create({ collect: 'set' })` create a `Map` that keeps many values per key, in an array or a `Set`, with an `add(key, value)` that puts one more value under a key.
