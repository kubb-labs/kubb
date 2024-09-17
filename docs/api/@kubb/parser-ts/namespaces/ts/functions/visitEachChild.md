[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitEachChild

# visitEachChild()

## visitEachChild(node, visitor, context)

```ts
function visitEachChild<T>(
   node, 
   visitor, 
   context): T
```

Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.

### Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `T`

The Node whose children will be visited.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

The callback used to visit each child.

• **context**: `undefined` \| [`TransformationContext`](../interfaces/TransformationContext.md)

A lexical environment context for the visitor.

### Returns

`T`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9388

## visitEachChild(node, visitor, context, nodesVisitor, tokenVisitor)

```ts
function visitEachChild<T>(
   node, 
   visitor, 
   context, 
   nodesVisitor?, 
   tokenVisitor?): T | undefined
```

Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.

### Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `undefined` \| `T`

The Node whose children will be visited.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

The callback used to visit each child.

• **context**: `undefined` \| [`TransformationContext`](../interfaces/TransformationContext.md)

A lexical environment context for the visitor.

• **nodesVisitor?**

• **tokenVisitor?**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

### Returns

`T` \| `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9396
