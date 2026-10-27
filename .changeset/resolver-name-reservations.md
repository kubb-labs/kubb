---
'@kubb/core': patch
'@kubb/kit': patch
---

Add `Resolver.reserveNames` and `Resolver.resolveName` to prevent duplicate exports. Keys can be strings or arrays. The driver reserves component names after applying macros and filters.
