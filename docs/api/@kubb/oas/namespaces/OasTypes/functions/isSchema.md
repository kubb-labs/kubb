[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OasTypes](../index.md) / isSchema

# isSchema()

```ts
function isSchema(check, isPolymorphicAllOfChild?): check is SchemaObject
```

## Parameters

• **check**: `unknown`

JSON Schema object to determine if it's a non-polymorphic schema.

• **isPolymorphicAllOfChild?**: `boolean`

If this JSON Schema object is the child of a polymorphic `allOf`.

## Returns

`check is SchemaObject`

If the JSON Schema object is a JSON Schema object.

## Defined in

node\_modules/.pnpm/oas@24.9.0/node\_modules/oas/dist/types.d.ts:157
