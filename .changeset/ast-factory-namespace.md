---
'@kubb/ast': major
'@kubb/core': major
---

Group node constructors under an `ast.factory` namespace, mirroring `ts.factory.createX`.

`@kubb/ast` no longer exports the `createX` node constructors from its root barrel. They move to a new `@kubb/ast/factory` subpath, the `ts.factory` analogue. The root keeps node definitions (`schemaDef`, `operationDef`, ...) and helpers (`narrowSchema`, `buildGroupParam`, ...); the `@kubb/ast/utils` subpath is unchanged.

`@kubb/core` assembles both into a single `ast` namespace, so `import { ast } from '@kubb/core'` reaches the root as `ast.schemaDef` and the constructors as `ast.factory.createSchema(...)`.

Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`, or import the constructor directly from `@kubb/ast/factory`.
