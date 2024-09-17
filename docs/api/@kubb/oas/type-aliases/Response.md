[API](../../../packages.md) / [@kubb/oas](../index.md) / Response

# Response\<TOAS, TPath, TMethod, TStatusCode\>

```ts
type Response<TOAS, TPath, TMethod, TStatusCode>: FromSchema<JSONResponseSchema<TOAS, TPath, TMethod, TStatusCode>>;
```

## Type Parameters

• **TOAS** *extends* [`OASDocument`](../namespaces/OasTypes/type-aliases/OASDocument.md)

• **TPath** *extends* keyof `PathMap`\<`TOAS`\>

• **TMethod** *extends* keyof `MethodMap`\<`TOAS`, `TPath`\>

• **TStatusCode** *extends* keyof `StatusMap`\<`TOAS`, `TPath`, `TMethod`\> = `200`

## Defined in

[packages/oas/src/infer/response.ts:25](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/oas/src/infer/response.ts#L25)
