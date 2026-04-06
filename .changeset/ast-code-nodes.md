---
"@kubb/ast": minor
"@kubb/plugin-ts": patch
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
---

Add structured AST nodes mirroring every JSX component from `@kubb/react-fabric`.

### `@kubb/ast`

New node types in `nodes/code.ts`:
- `ConstNode` (`kind: 'Const'`) — mirrors the `Const` component
- `TypeNode` (`kind: 'Type'`) — mirrors the `Type` component; a plain type alias declaration with `name`, `export`, `JSDoc`, and `nodes` fields
- `FunctionNode` (`kind: 'Function'`) — mirrors the `Function` component
- `ArrowFunctionNode` (`kind: 'ArrowFunction'`) — mirrors the `Function.Arrow` component
- `JSDocNode` — JSDoc prop shape used on the above nodes
- `CodeNode` — discriminated union of all four code node types

New `ParamsTypeNode` (`kind: 'ParamsType'`) in `nodes/function.ts` — language-agnostic type expressions for function parameter annotations, with three variants: `reference`, `struct`, and `member`.

Updated `SourceNode` in `nodes/file.ts` — added optional `nodes?: Array<CodeNode>` field alongside `value` for carrying structured AST children.

Updated `NodeKind` — added `'Const'`, `'Type'`, `'ParamsType'`, `'Function'`, `'ArrowFunction'`.

New factory functions: `createConst`, `createType`, `createParamsType`, `createFunction`, `createArrowFunction`.

Renamed `FunctionNode` (function-parameter printer variants) to `FunctionParamNode`. The `functionPrinter` handler key `type` was renamed to `paramsType`.

### `@kubb/plugin-ts`, `@kubb/plugin-client`, `@kubb/plugin-cypress`

Updated to use the new `createParamsType` factory and `FunctionParamNode` type.
