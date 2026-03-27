---
"@kubb/ast": minor
"@kubb/plugin-ts": patch
---

### `@kubb/ast`

- Added `createOperationParams(node, options)` utility that converts an `OperationNode` into a `FunctionParametersNode`.
- Added `reference` variant to `TypeNode` for plain type name strings (e.g. `'string'`, `'QueryParams'`), so all type annotations in the AST are always `TypeNode` — never raw strings.
- Changed `FunctionParameterNode.type` from `string | TypeNode` to `TypeNode`.
- Changed `ParameterGroupNode.type` from `string | undefined` to `TypeNode | undefined`.
- Updated `createTypeNode`, `createFunctionParameter`, and `createParameterGroup` factories to accept `TypeNode` only.
- Removed `typeToString` helper from `utils.ts`; `resolveType` now returns `TypeNode` directly.

### `@kubb/plugin-ts`

- Updated `functionPrinter` to handle all three `TypeNode` variants (`member`, `struct`, `reference`) explicitly; removed all `typeof … === 'string'` checks.
