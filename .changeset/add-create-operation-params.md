---
'@kubb/ast': minor
---

Add `createOperationParams` utility for converting operations to function parameters.

- `createOperationParams(node, options)` converts an `OperationNode` into a `FunctionParametersNode`
- `TypeNode` now has a `reference` variant for plain type name strings
- `FunctionParameterNode.type` and `ParameterGroupNode.type` now require `TypeNode` instead of accepting strings
