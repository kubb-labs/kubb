---
"@kubb/adapter-oas": patch
---

A child schema that extends a discriminated parent through `allOf` and declares its own discriminator for grandchildren no longer collapses to `never`. The parent's discriminator property now accepts the keys of every level, the child keeps the parent's type, and a grandchild narrows to its own mapping key.
