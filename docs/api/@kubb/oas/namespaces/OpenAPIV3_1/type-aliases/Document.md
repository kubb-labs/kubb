[API](../../../../../packages.md) / [@kubb/oas](../../../index.md) / [OpenAPIV3\_1](../index.md) / Document

# Document\<T\>

```ts
type Document<T>: Modify<Omit<Document<T>, "paths" | "components">, object & Pick<PathsWebhooksComponents<T>, "paths"> & Omit<Partial<PathsWebhooksComponents<T>>, "paths"> | Pick<PathsWebhooksComponents<T>, "webhooks"> & Omit<Partial<PathsWebhooksComponents<T>>, "webhooks"> | Pick<PathsWebhooksComponents<T>, "components"> & Omit<Partial<PathsWebhooksComponents<T>>, "components">>;
```

## Type Parameters

• **T** *extends* `object` = `object`

## Defined in

node\_modules/.pnpm/openapi-types@12.1.3/node\_modules/openapi-types/dist/index.d.ts:20
