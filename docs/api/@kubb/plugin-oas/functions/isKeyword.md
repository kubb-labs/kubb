[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / isKeyword

# isKeyword()

```ts
function isKeyword<T, K>(meta, keyword): meta is Extract<T, SchemaKeywordMapper[K]>
```

## Type Parameters

• **T** *extends* [`Schema`](../type-aliases/Schema.md)

• **K** *extends* keyof [`SchemaKeywordMapper`](../type-aliases/SchemaKeywordMapper.md)

## Parameters

• **meta**: `T`

• **keyword**: `K`

## Returns

`meta is Extract<T, SchemaKeywordMapper[K]>`

## Defined in

[plugin-oas/src/SchemaMapper.ts:143](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/plugin-oas/src/SchemaMapper.ts#L143)
