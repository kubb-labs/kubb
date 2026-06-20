---
"@kubb/ast": major
---

Remove the TypeScript function-parameter model from `@kubb/ast`. The function-parameter nodes and factories (`createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`), the `createOperationParams` builder, the `caseParams` helper, and the `OperationParamsResolver` type are no longer part of `@kubb/ast`. These are language-specific code generation, so they now live in `@kubb/plugin-ts` (the node model and `createOperationParams`) and the shared plugin internals (`caseParams`, `OperationParamsResolver`). `@kubb/ast` keeps the spec-agnostic node tree.
