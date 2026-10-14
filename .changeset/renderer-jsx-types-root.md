---
'@kubb/renderer-jsx': patch
---

Export types from the package root and derive component props from the AST nodes.

- Remove the `@kubb/renderer-jsx/types` subpath. `KubbReactNode`, `KubbReactElement`, `Key` and `JSDoc` are exported from the root.
- `Const`, `Function`, `Function.Arrow` and `Type` props are the matching `@kubb/ast` node fields.
- A `generics` array is passed to the node as an array instead of being joined.
