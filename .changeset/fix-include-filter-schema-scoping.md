---
'@kubb/ast': minor
'@kubb/core': patch
---

Fix `include` filter not preventing generation of component schemas from excluded operations.

When `include` contains operation-based filters (`tag`, `operationId`, `path`, `method`, or `contentType`), only the schemas transitively referenced by the included operations are now generated. Schemas that are only used by excluded operations are silently skipped.

**New `@kubb/ast` export: `collectUsedSchemaNames`**

```ts
import { collectUsedSchemaNames } from '@kubb/ast'

// Returns the set of top-level schema names reachable from the given operations.
const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)
```

**Before** (all schemas generated regardless of `include`):

```
types/
├── ItemStatus.ts     ✅
├── ItemsResponse.ts  ✅
├── OrderStatus.ts    ❌ generated even though getOrders is excluded
└── OrdersResponse.ts ❌ generated even though getOrders is excluded
```

**After** (only schemas reachable from included operations):

```
types/
├── ItemStatus.ts     ✅
└── ItemsResponse.ts  ✅
```

> [!NOTE]
> When `include` contains a `schemaName` filter alongside operation filters, the new schema-scoping logic is disabled and `schemaName` rules apply instead.
