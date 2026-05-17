---
"@kubb/ast": minor
"@kubb/core": patch
"@kubb/adapter-oas": patch
"@kubb/parser-ts": patch
---

Performance improvements for large OpenAPI specs.

- **`@kubb/ast`**: Add `mergeAdjacentObjectsLazy` generator for lazy stateful merging of adjacent allOf object schemas. Memoize `collectReferencedSchemaNames` with a `WeakMap` so repeated callers pay the tree-walk cost only once per schema node.
- **`@kubb/core`**: Parallelize per-node generator dispatch with `Promise.all` so schema and operation generators run concurrently. Defer file writes to a single flush after all plugins complete instead of flushing after each plugin. Convert `fsStorage` directory walk to an async generator for streaming filesystem traversal.
- **`@kubb/adapter-oas`**: Replace `flatMap` content-type loop with a `for`/`push` pattern (7× faster for the typical 2–4 content-type case).
- **`@kubb/parser-ts`**: Fix British-English spellings in JSDoc comments (`normalising` → `normalizing`, `neutralise` → `neutralize`).
