[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3](../index.md) / PathItemObject

# PathItemObject\<T\>

```ts
type PathItemObject<T>: object & { [method in HttpMethods]?: OperationObject<T> };
```

## Type declaration

### $ref?

```ts
optional $ref: string;
```

### description?

```ts
optional description: string;
```

### parameters?

```ts
optional parameters: (ReferenceObject | ParameterObject)[];
```

### servers?

```ts
optional servers: ServerObject[];
```

### summary?

```ts
optional summary: string;
```

## Type Parameters

• **T** *extends* `object` = `object`

## Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:207
