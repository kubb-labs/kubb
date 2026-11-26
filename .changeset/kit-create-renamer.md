---
'@kubb/kit': minor
---

Add `createRenamer()` to `kubb/kit`. It hands out names that do not clash by adding 2, 3 and so on, and tracks which owner holds each name. The resolver's `resolveName` and `Url.toPath` now use it, with the same names as before.
