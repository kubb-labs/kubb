---
'@kubb/ast': minor
---

Add structured AST nodes for code generation.

New node types:

- `ConstNode` — variable declarations with `as const`
- `TypeNode` — type alias declarations
- `FunctionNode` — function declarations
- `ArrowFunctionNode` — arrow function expressions
- `ParamsTypeNode` — function parameter type annotations with `reference`, `struct`, and `member` variants

New factory functions: `createConst`, `createType`, `createParamsType`, `createFunction`, `createArrowFunction`.

`SourceNode` now supports an optional `nodes` field for structured AST children.
