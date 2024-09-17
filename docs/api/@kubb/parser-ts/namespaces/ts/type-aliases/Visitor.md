[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Visitor

# Visitor()\<TIn, TOut\>

```ts
type Visitor<TIn, TOut>: (node) => VisitResult<TOut>;
```

A function that accepts and possibly transforms a node.

## Type Parameters

• **TIn** *extends* [`Node`](../interfaces/Node.md) = [`Node`](../interfaces/Node.md)

• **TOut** *extends* [`Node`](../interfaces/Node.md) \| `undefined` = `TIn` \| `undefined`

## Parameters

• **node**: `TIn`

## Returns

[`VisitResult`](VisitResult.md)\<`TOut`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7972
