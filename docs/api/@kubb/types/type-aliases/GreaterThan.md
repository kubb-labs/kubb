[API](../../../packages.md) / [@kubb/types](../index.md) / GreaterThan

# GreaterThan\<T, U\>

```ts
type GreaterThan<T, U>: ArrayWithLength<U> extends [...ArrayWithLength<T>, ...(infer _)] ? false : true;
```

## Type Parameters

• **T** *extends* `number`

• **U** *extends* `number`

## Defined in

[index.ts:24](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/types/src/index.ts#L24)
