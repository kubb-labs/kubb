[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / GetSchemaGeneratorOptions

# GetSchemaGeneratorOptions\<T\>

```ts
type GetSchemaGeneratorOptions<T>: T extends SchemaGenerator<infer Options, any, any> ? Options : never;
```

## Type Parameters

• **T** *extends* [`SchemaGenerator`](../classes/SchemaGenerator.md)\<`any`, `any`, `any`\>

## Defined in

[plugin-oas/src/SchemaGenerator.ts:19](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/plugin-oas/src/SchemaGenerator.ts#L19)
