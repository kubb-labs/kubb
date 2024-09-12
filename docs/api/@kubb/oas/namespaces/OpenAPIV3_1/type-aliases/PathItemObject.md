[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3\_1](../index.md) / PathItemObject

# PathItemObject\<T\>

```ts
type PathItemObject<T>: Modify<PathItemObject<T>, object> & { [method in HttpMethods]?: OperationObject<T> };
```

## Type Parameters

• **T** *extends* `object` = `object`

## Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:43
