---
'@kubb/ast': minor
'@kubb/core': patch
---

Fix `include` filter not preventing generation of component schemas from excluded operations.

When `include` contains operation-based filters, only schemas transitively referenced by the included operations are now generated. New `@kubb/ast` export: `collectUsedSchemaNames(operations, schemas)`.
