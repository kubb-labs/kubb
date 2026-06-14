---
'@kubb/ast': minor
'@kubb/core': minor
---

Group node constructors under an `ast.factory` namespace, mirroring `ts.factory.createX`.

`@kubb/ast` no longer exports the `createX` node constructors at the top level. They move under a `factory` namespace, reached as `ast.factory.createSchema(...)`, `ast.factory.createFile(...)`, and so on, the same way the TypeScript compiler groups node creation under `ts.factory`. Node definitions (`schemaDef`, `operationDef`, ...) and the remaining helpers (`buildGroupParam`, `resolveParamType`, ...) stay on the namespace root.

`@kubb/core` exposes the surface through a new `ast` module, so `import { ast } from '@kubb/core'` reaches both the namespace root and `ast.factory.createX`.

Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.
