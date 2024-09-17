[API](../../../packages.md) / [@kubb/types](../index.md) / TupleToUnion

# TupleToUnion\<T\>

```ts
type TupleToUnion<T>: T extends any[] ? T[number] : never;
```

## Type Parameters

• **T**

## Defined in

[index.ts:20](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/types/src/index.ts#L20)
