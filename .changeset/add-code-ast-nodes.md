---
"@kubb/ast": minor
---

Add structured AST nodes for code generation: `ConstNode`, `TypeNode`, `FunctionNode`, `ArrowFunctionNode`, `ParamsTypeNode`. New factory functions: `createConst`, `createType`, `createParamsType`, `createFunction`, `createArrowFunction`. `SourceNode` now supports an optional `nodes` field.
