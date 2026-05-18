---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Split `@kubb/ast` schema helpers into `transformers.ts`, `resolvers.ts`, and `utils.ts`. Remove deprecated alias exports. Fix `adapter.getImports()` returning `name` as `string[]` correctly.
