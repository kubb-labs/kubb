---
'@kubb/renderer-jsx': minor
---

`Const`, `Type`, `Function` and `Function.Arrow` directly in a `File` now register their own source block, and take `inline`, which lets importing files use the body in place of the name. A new `Schema` component prints a schema node with its imports.

`File.Source` is deprecated and removed in Kubb v6.
