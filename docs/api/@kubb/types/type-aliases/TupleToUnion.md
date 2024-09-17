[API](../../../packages.md) / [@kubb/types](../index.md) / TupleToUnion

# TupleToUnion\<T\>

```ts
type TupleToUnion<T>: T extends any[] ? T[number] : never;
```

## Type Parameters

• **T**

## Defined in

[index.ts:20](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/types/src/index.ts#L20)
