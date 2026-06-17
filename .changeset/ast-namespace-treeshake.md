---
'@kubb/ast': patch
'@kubb/core': patch
---

Expose every `@kubb/ast` export under a single `ast` namespace and make the package tree-shakable.

`import { ast } from '@kubb/ast'` (or from `@kubb/core`) now reaches the whole surface the way the TypeScript compiler exposes `ts.factory`, for example `ast.factory.createSchema(...)`. The namespace is a compile-time re-export and the package is marked side-effect-free, so a bundler keeps only the factories you actually use. Flat named imports such as `import { factory, defineNode } from '@kubb/ast'` keep working.
