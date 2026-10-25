---
'@kubb/adapter-oas': patch
---

A schema that is a single-member `allOf` around a `$ref` is no longer resolved to `unknown` as an alias cycle with itself.
