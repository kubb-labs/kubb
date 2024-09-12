[API](../../../packages.md) / [@kubb/types](../index.md) / TupleToUnion

# TupleToUnion\<T\>

```ts
type TupleToUnion<T>: T extends any[] ? T[number] : never;
```

## Type Parameters

• **T**

## Defined in

[index.ts:20](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/types/src/index.ts#L20)
