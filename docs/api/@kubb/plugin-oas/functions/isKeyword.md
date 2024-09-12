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

[plugin-oas/src/SchemaMapper.ts:143](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/SchemaMapper.ts#L143)
