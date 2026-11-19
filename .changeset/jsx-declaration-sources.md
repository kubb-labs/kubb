---
'@kubb/ast': minor
'@kubb/renderer-jsx': minor
---

`Const`, `Type`, `Function` and `Function.Arrow` placed directly in a `File` now register their own source block, so a `File.Source` wrapper is only needed for `pointer` or `inline`. The new `Schema` component prints a schema node, adds the printer's imports, and renders its children with the code.

`@kubb/ast` adds the function-parameter nodes from `@kubb/plugin-ts`: `ast.factory.createFunctionParameters` and its sibling factories, and `ast.params.print(node, 'declaration' | 'call')`. The `params` prop of `Function` and `Function.Arrow` accepts such a node.
