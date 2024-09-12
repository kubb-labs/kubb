[API](../../../packages.md) / [@kubb/oas](../index.md) / findSchemaDefinition

# findSchemaDefinition()

```ts
function findSchemaDefinition($ref, definition?): any
```

Lookup a reference pointer within an OpenAPI definition and return the schema that it resolves
to.

## Parameters

• **$ref**: `string`

Reference to look up a schema for.

• **definition?**

OpenAPI definition to look for the `$ref` pointer in.

## Returns

`any`

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/utils.d.ts:13
