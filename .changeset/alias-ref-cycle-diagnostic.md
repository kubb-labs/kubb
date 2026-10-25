---
"@kubb/core": patch
"@kubb/adapter-oas": patch
---

A loop of schemas that only `$ref` each other now reports a `KUBB_ALIAS_CYCLE` warning, in addition to resolving to `unknown`.
