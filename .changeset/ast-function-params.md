---
"@kubb/ast": minor
---

Add AST nodes and printer for function parameters.

New node types: `FunctionParameterNode`, `FunctionParametersNode`, `ObjectBindingParameterNode`.

New factory functions: `createFunctionParameter`, `createFunctionParameters`, `createObjectBindingParameter`.

New type guards: `isFunctionParameterNode`, `isFunctionParametersNode`, `isObjectBindingParameterNode`.

New `functionPrinter` with four rendering modes (`declaration`, `call`, `keys`, `values`) and `defineFunctionPrinter` for custom printer factories.
