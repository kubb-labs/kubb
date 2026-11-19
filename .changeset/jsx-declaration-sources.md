---
'@kubb/ast': minor
'@kubb/renderer-jsx': minor
---

`Const`, `Type`, `Function` and `Function.Arrow` directly in a `File` now register their own source block, and take `pointer`, `inline` and `comments`. A new `Schema` component prints a schema node with its imports.

`@kubb/ast` adds the function-parameter nodes from `@kubb/plugin-ts`, with factories in `ast.factory`. `Function` takes them in `params` or as `Function.Params` children, `Function.Call` prints a call, and `printParams` returns the text.

`File.Source` and the `JSDoc` prop are deprecated, and both are removed in Kubb v6.
