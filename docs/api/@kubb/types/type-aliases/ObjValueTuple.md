[API](../../../packages.md) / [@kubb/types](../index.md) / ObjValueTuple

# ObjValueTuple\<T, KS, R\>

```ts
type ObjValueTuple<T, KS, R>: KS extends [infer K, ...(infer KT)] ? ObjValueTuple<T, KT, [...R, [K & keyof T, T[K & keyof T]]]> : R;
```

## Type Parameters

• **T**

• **KS** *extends* `any`[] = `TuplifyUnion`\<keyof `T`\>

• **R** *extends* `any`[] = []

## Defined in

[index.ts:16](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/types/src/index.ts#L16)
