[API](../../../packages.md) / [@kubb/types](../index.md) / TupleToUnion

# TupleToUnion\<T\>

```ts
type TupleToUnion<T>: T extends any[] ? T[number] : never;
```

## Type Parameters

• **T**

## Defined in

[index.ts:20](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/types/src/index.ts#L20)
