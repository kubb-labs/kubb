---
'@kubb/ast': major
'@kubb/core': major
---

Reshape the `@kubb/ast` factory surface around an `ast.factory` namespace that mirrors `ts.factory.createX`.

The flat `createX` node constructors leave the `@kubb/ast` root barrel. Reach them through the `factory` namespace as `ast.factory.createSchema(...)`. Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.

`@kubb/ast` re-exports itself as the `ast` namespace, so `import { ast } from '@kubb/ast'` reaches node definitions as `ast.schemaDef`, guards and helpers as `ast.narrowSchema`, and constructors as `ast.factory.createSchema(...)`. `@kubb/kit` re-exports the same `ast` namespace, and `@kubb/core` uses `ast.factory` internally to build its own file and import nodes.
