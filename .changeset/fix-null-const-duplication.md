---
'@kubb/adapter-oas': patch
---

Fix `null | null` duplication for `const: null` schemas.

`convertConst()` no longer propagates the `nullable` flag when the const value is `null`, and `convertObject()` skips setting `nullable` on properties whose resolved type is already `null`.
