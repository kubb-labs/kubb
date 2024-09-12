[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3\_1](../index.md) / SchemaObject

# SchemaObject

```ts
type SchemaObject: ArraySchemaObject | NonArraySchemaObject | MixedSchemaObject;
```

There is no way to tell typescript to require items when type is either 'array' or array containing 'array' type
'items' will be always visible as optional
Casting schema object to ArraySchemaObject or NonArraySchemaObject will work fine

## Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:67
