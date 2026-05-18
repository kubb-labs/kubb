---
"@kubb/ast": minor
"@kubb/core": patch
"@kubb/adapter-oas": patch
"@kubb/parser-ts": patch
---

Performance improvements for large OpenAPI specs.

- **`@kubb/ast`**: Add `mergeAdjacentObjectsLazy` for lazy stateful merging of adjacent allOf schemas. Memoize `collectReferencedSchemaNames` with a `WeakMap`.
- **`@kubb/core`**: Parallelize per-node generator dispatch with `Promise.all`. Convert `fsStorage` directory walk to an async generator.
- **`@kubb/adapter-oas`**: Replace `flatMap` content-type loop with `for`/`push` (7× faster for typical 2–4 content types).
- **`@kubb/parser-ts`**: Fix British-English spellings in JSDoc comments.
