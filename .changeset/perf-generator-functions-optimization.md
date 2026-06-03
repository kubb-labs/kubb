---
"@kubb/ast": minor
"@kubb/core": patch
"@kubb/adapter-oas": patch
"@kubb/parser-ts": patch
---

Performance improvements for large OpenAPI specs.

- `@kubb/ast`: add `mergeAdjacentObjectsLazy` for lazy stateful merging of adjacent allOf schemas. Memoize `collectReferencedSchemaNames` with a `WeakMap`.
- `@kubb/core`: parallelize per-node generator dispatch with `Promise.all`. Convert the `fsStorage` directory walk to an async generator.
- `@kubb/adapter-oas`: replace the `flatMap` content-type loop with `for`/`push` (7× faster for the typical 2 to 4 content types).
- `@kubb/parser-ts`: fix British-English spellings in JSDoc comments.
