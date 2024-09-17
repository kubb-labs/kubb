[API](../../../packages.md) / [@kubb/types](../index.md) / SplitByDelimiter

# SplitByDelimiter\<T, D\>

```ts
type SplitByDelimiter<T, D>: T extends `${infer P}${D}${infer Q}` ? [P, ...SplitByDelimiter<Q, D>] : [T];
```

## Type Parameters

• **T** *extends* `string`

• **D** *extends* `string`

## Defined in

[index.ts:26](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/types/src/index.ts#L26)
