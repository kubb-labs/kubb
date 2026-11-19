---
'@kubb/ast': minor
'@kubb/renderer-jsx': minor
---

`Const`, `Type`, `Function` and `Function.Arrow` placed directly in a `File` now register their own source block. They also take `pointer` and `inline`, so a single declaration no longer needs a `File.Source` wrapper. The new `Schema` component prints a schema node, adds the printer's imports, and renders its children with the code.

`@kubb/ast` adds the function-parameter nodes from `@kubb/plugin-ts` as language-neutral data: `ast.factory.createFunctionParameters` and its sibling factories. The JavaScript components print them: `Function` and `Function.Arrow` take a node in `params` or `Function.Params` children, `Function.Call` prints a call, and `printParams` returns the text. `Const`, `Type`, `Function` and `Function.Arrow` also take a `comments` prop.
