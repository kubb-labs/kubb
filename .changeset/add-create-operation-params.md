---
"@kubb/ast": minor
---

Add `createOperationParams(node, options)` to convert an `OperationNode` into a `FunctionParametersNode`. `TypeNode` gains a `reference` variant. `FunctionParameterNode.type` and `ParameterGroupNode.type` now require `TypeNode` instead of strings.
