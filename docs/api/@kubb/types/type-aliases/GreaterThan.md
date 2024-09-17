[API](../../../packages.md) / [@kubb/types](../index.md) / GreaterThan

# GreaterThan\<T, U\>

```ts
type GreaterThan<T, U>: ArrayWithLength<U> extends [...ArrayWithLength<T>, ...(infer _)] ? false : true;
```

## Type Parameters

• **T** *extends* `number`

• **U** *extends* `number`

## Defined in

[index.ts:24](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/types/src/index.ts#L24)
