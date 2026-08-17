---
'@kubb/ast': major
'@kubb/core': major
---

Reshape the `@kubb/ast` factory surface around an `ast.factory` namespace that mirrors `ts.factory.createX`.

The flat `createX` node constructors leave the `@kubb/ast` root barrel. Reach them through the `factory` namespace as `ast.factory.createSchema(...)`, or import them from the `@kubb/ast/factory` subpath. Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.

`@kubb/core` re-exports `@kubb/ast` as the `ast` namespace, so `import { ast } from '@kubb/core'` reaches node definitions as `ast.schemaDef`, guards and helpers as `ast.narrowSchema`, and constructors as `ast.factory.createSchema(...)`.
