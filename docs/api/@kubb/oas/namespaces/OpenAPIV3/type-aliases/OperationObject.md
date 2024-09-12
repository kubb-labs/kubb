[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3](../index.md) / OperationObject

# OperationObject\<T\>

```ts
type OperationObject<T>: object & T;
```

## Type declaration

### callbacks?

```ts
optional callbacks: object;
```

#### Index Signature

 \[`callback`: `string`\]: [`ReferenceObject`](../interfaces/ReferenceObject.md) \| [`CallbackObject`](../interfaces/CallbackObject.md)

### deprecated?

```ts
optional deprecated: boolean;
```

### description?

```ts
optional description: string;
```

### externalDocs?

```ts
optional externalDocs: ExternalDocumentationObject;
```

### operationId?

```ts
optional operationId: string;
```

### parameters?

```ts
optional parameters: (ReferenceObject | ParameterObject)[];
```

### requestBody?

```ts
optional requestBody: ReferenceObject | RequestBodyObject;
```

### responses

```ts
responses: ResponsesObject;
```

### security?

```ts
optional security: SecurityRequirementObject[];
```

### servers?

```ts
optional servers: ServerObject[];
```

### summary?

```ts
optional summary: string;
```

### tags?

```ts
optional tags: string[];
```

## Type Parameters

• **T** *extends* `object` = `object`

## Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:216
