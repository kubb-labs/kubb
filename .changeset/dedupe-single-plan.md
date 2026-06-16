---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Consolidate the OAS dedupe pass behind a single `Plan` object. `plan()` now returns one object that owns its rewriting: `apply` for operations and nested schemas, `applyTopLevel` for top-level schemas, and `isAlias` to skip a duplicate top-level name. The internal `DedupePlan`, `DedupeLookups`, and `DedupeTarget` types and the standalone `apply` function are gone, and the `@kubb/ast` `Dedupe` seam drops its `apply` member because the plan carries that behavior. Generated output is unchanged.
