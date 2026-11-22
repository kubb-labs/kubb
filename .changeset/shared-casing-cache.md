---
'@kubb/adapter-oas': patch
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Convert schema and operation names through the one cache in `@kubb/core`, so a name is converted once per run instead of once per package.
