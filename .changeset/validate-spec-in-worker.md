---
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Validate the spec in a worker thread while generation runs. On the bunq spec, a `plugin-ts` build is about 29% faster. Warnings are unchanged.
