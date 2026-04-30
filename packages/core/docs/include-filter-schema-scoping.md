# Include filter schema scoping

The `include` option on any Kubb plugin controls which operations generate code. Starting with this change, `include` also controls which component schemas generate code — schemas that are only referenced by excluded operations are no longer emitted.

## Background

OpenAPI specifications declare reusable schemas under `components/schemas`. Plugins such as `plugin-ts` walk both the top-level schema list and the operation list to decide what to generate. Before this fix, `include` filters applied only to operations. Every top-level schema was always generated regardless of whether it was reachable from an included operation.

This caused unexpected output: configuring `include: [{ type: 'tag', pattern: 'items' }]` still produced types for schemas that were only used by the excluded `orders` operations.

## How it works now

When a plugin's `include` option contains at least one operation-scoped filter type (`tag`, `operationId`, `path`, `method`, or `contentType`) and no `schemaName` filter, the build pipeline performs the following steps before visiting schemas:

1. Evaluate every operation against the `include` / `exclude` rules to produce the list of included operations.
2. Call `collectUsedSchemaNames(includedOps, inputNode.schemas)` to collect all top-level schema names transitively reachable from those operations — following parameters, request body content, and response schemas through the full `$ref` graph.
3. Skip any named top-level schema that is not in the resulting set.

The `collectUsedSchemaNames` utility is exported from `@kubb/ast` and can be used in custom plugins or generators.

## Before and after

Given this OpenAPI spec with two independent tags:

```json
{
  "paths": {
    "/items": { "get": { "tags": ["items"], "parameters": [{ "schema": { "$ref": "#/components/schemas/ItemStatus" } }] } },
    "/orders": { "get": { "tags": ["orders"], "parameters": [{ "schema": { "$ref": "#/components/schemas/OrderStatus" } }] } }
  },
  "components": {
    "schemas": {
      "ItemStatus": { "type": "string", "enum": ["ACTIVE", "INACTIVE"] },
      "OrderStatus": { "type": "string", "enum": ["NEW", "SHIPPED"] }
    }
  }
}
```

With `include: [{ type: 'tag', pattern: 'items' }]`:

| File | Before | After |
|---|---|---|
| `ItemStatus.ts` | ✅ generated | ✅ generated |
| `OrderStatus.ts` | ❌ generated (bug) | ✅ skipped |

## Mixing operation and schema filters

When `include` contains a `schemaName` filter alongside operation filters, the new scoping logic is disabled entirely. All schemas pass through the standard `resolveOptions` filtering, which honours `schemaName` rules directly.

```ts
// Operation filter only — schema scoping is active
include: [{ type: 'tag', pattern: 'items' }]

// Mixed — schema scoping is disabled; schemaName rules apply instead
include: [
  { type: 'tag', pattern: 'items' },
  { type: 'schemaName', pattern: 'Shared.*' },
]
```

## `collectUsedSchemaNames`

The underlying helper is part of `@kubb/ast` and available for use in custom plugins:

```ts
import { collectUsedSchemaNames } from '@kubb/ast'

const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)

for (const schema of inputNode.schemas) {
  if (schema.name && !allowed.has(schema.name)) continue
  // generate schema
}
```

The function follows `$ref` edges transitively, so a schema included because it is the response type of an included operation will itself pull in any schemas it references.
