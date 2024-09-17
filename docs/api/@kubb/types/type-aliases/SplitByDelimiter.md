[API](../../../packages.md) / [@kubb/types](../index.md) / SplitByDelimiter

# SplitByDelimiter\<T, D\>

```ts
type SplitByDelimiter<T, D>: T extends `${infer P}${D}${infer Q}` ? [P, ...SplitByDelimiter<Q, D>] : [T];
```

## Type Parameters

• **T** *extends* `string`

• **D** *extends* `string`

## Defined in

[index.ts:26](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/types/src/index.ts#L26)
