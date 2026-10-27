---
'@kubb/core': minor
'@kubb/kit': minor
---

Add `Resolver.reserveNames` and `Resolver.resolveName` so plugins can allocate stable declaration names without duplicate exports. The driver reserves component names before generators run, using each plugin's naming rules.
