---
'@kubb/ast': major
'@kubb/core': major
---

Reshape the `@kubb/ast` factory surface around an `ast.factory` namespace that mirrors `ts.factory.createX`.

The flat `createX` node constructors leave the `@kubb/ast` root barrel. Reach them through the `factory` namespace as `ast.factory.createSchema(...)`, or import them from the new `@kubb/ast/factory` subpath. Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.

The node and AST helpers `buildGroupParam`, `buildTypeLiteral`, `caseParams`, `collectUsedSchemaNames`, `containsCircularRef`, `findCircularSchemas`, `isStringType`, `resolveParamType`, and `syncSchemaRef` move off the root barrel onto the `@kubb/ast/utils` subpath. Import them from `@kubb/ast/utils` rather than `@kubb/ast` or the `ast` namespace.

`createStreamInput` folds into `createInput`. Pass `stream: true` for the streaming variant: `createInput({ stream: true, schemas, operations, meta })` returns the streaming `InputNode<true>` with `AsyncIterable` sources, while `createInput({ schemas, operations })` still returns the eager `InputNode`.

The function-parameter printer key type `FunctionNodeType` becomes `FunctionParamKind`, derived from `FunctionParamNode['kind']` so its values match the PascalCase node `kind` discriminants.

`@kubb/core` re-exports `@kubb/ast` as the `ast` namespace, so `import { ast } from '@kubb/core'` reaches node definitions as `ast.schemaDef`, guards and helpers as `ast.narrowSchema`, and constructors as `ast.factory.createSchema(...)`.
