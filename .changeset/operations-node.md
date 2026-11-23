---
'@kubb/ast': minor
'@kubb/kit': minor
---

Add `OperationsNode`, a node that holds a list of operations: `kind: 'Operations'` and `operations`. Build one with `ast.factory.createOperations({ operations })`, and match it with `ast.node.kinds.operations`. A walk over it visits each operation.

A template with `kind: 'Operations'` now gets an `OperationsNode` instead of `Array<OperationNode>`. Read `node.operations` where the template read the array. Every template kind is now a node kind, so `kind: ast.node.kinds.operations` works too. A generator's `operations()` method still gets the array.
