---
'@kubb/kit': patch
---

Add `memo.scope(ctx, name)`. It returns the build memo with `name:` in front of every key, and types each slot from its full key in `Kubb.MemoRegistry`, such as `'plugin-zod:printer'`. `memo(key, compute)`, `memo(store, key, compute)` and `memo.create` work as before.
