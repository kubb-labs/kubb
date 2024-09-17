[API](../../../packages.md) / [@kubb/types](../index.md) / GreaterThan

# GreaterThan\<T, U\>

```ts
type GreaterThan<T, U>: ArrayWithLength<U> extends [...ArrayWithLength<T>, ...(infer _)] ? false : true;
```

## Type Parameters

• **T** *extends* `number`

• **U** *extends* `number`

## Defined in

[index.ts:24](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/types/src/index.ts#L24)
