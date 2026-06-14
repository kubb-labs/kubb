---
'@kubb/ast': major
'@kubb/core': major
---

Group node constructors under an `ast.factory` namespace, mirroring `ts.factory.createX`.

`@kubb/ast` no longer exports the `createX` node constructors from its root barrel. They move to a new `@kubb/ast/factory` subpath, the `ts.factory` analogue. The root keeps node definitions (`schemaDef`, `operationDef`, ...) and helpers (`narrowSchema`, `buildGroupParam`, ...); the `@kubb/ast/utils` subpath is unchanged.

`@kubb/core` assembles both into a single `ast` namespace, so `import { ast } from '@kubb/core'` reaches the root as `ast.schemaDef` and the constructors as `ast.factory.createSchema(...)`.

Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`, or import the constructor directly from `@kubb/ast/factory`.

The function-parameter printer key type `FunctionNodeType` is renamed to `FunctionParamKind`, now derived from `FunctionParamNode['kind']` so its values match the PascalCase node `kind` discriminants.

`extractStringsFromNodes` is now exported from the `@kubb/ast` root barrel as well, so it is reachable as `ast.extractStringsFromNodes` through `@kubb/core` without importing the `@kubb/ast/utils` subpath.

The node and AST helpers `buildGroupParam`, `buildTypeLiteral`, `caseParams`, `collectUsedSchemaNames`, `containsCircularRef`, `findCircularSchemas`, `isStringType`, `resolveParamType`, and `syncSchemaRef` move off the `@kubb/ast` root barrel onto the `@kubb/ast/utils` subpath. Import them from `@kubb/ast/utils` instead of `@kubb/ast` (or `ast.fn` via `@kubb/core`).
