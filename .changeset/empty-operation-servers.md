---
'@kubb/adapter-oas': patch
---

An operation with an empty `servers` list now gets its path item's servers, since an empty list overrides nothing.
