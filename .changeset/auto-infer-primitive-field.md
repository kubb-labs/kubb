---
'@kubb/ast': patch
---

Auto-infer `primitive` field in AST factory functions.

`createSchema`, `createProperty`, and `createOperation` now automatically set the `primitive` field based on the node `type`, reducing boilerplate.
