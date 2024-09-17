[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TransformerFactory

# TransformerFactory()\<T\>

```ts
type TransformerFactory<T>: (context) => Transformer<T>;
```

A function that is used to initialize and return a `Transformer` callback, which in turn
will be used to transform one or more nodes.

## Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

## Parameters

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

## Returns

[`Transformer`](Transformer.md)\<`T`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7964
