[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitNodes

# visitNodes()

## visitNodes(nodes, visitor, test, start, count)

```ts
function visitNodes<TIn, TInArray, TOut>(
   nodes, 
   visitor, 
   test, 
   start?, 
   count?): NodeArray<TOut> | TInArray & undefined
```

Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.

- If the input node array is undefined, the output is undefined.
- If the visitor can return undefined, the node it visits in the array will be reused.
- If the output node array is not undefined, then its contents will satisfy the test.
- In order to obtain a return type that is more specific than `NodeArray<Node>`, a test
  function _must_ be provided, and that function must be a type predicate.

### Type Parameters

• **TIn** *extends* [`Node`](../interfaces/Node.md)

• **TInArray** *extends* `undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<`TIn`\>

• **TOut** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **nodes**: `TInArray`

The NodeArray to visit.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`TIn`, `undefined` \| [`Node`](../interfaces/Node.md)\>

The callback used to visit a Node.

• **test**

A node test to execute for each node.

• **start?**: `number`

An optional value indicating the starting offset at which to start visiting.

• **count?**: `number`

An optional value indicating the maximum number of nodes to visit.

### Returns

[`NodeArray`](../interfaces/NodeArray.md)\<`TOut`\> \| `TInArray` & `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9328

## visitNodes(nodes, visitor, test, start, count)

```ts
function visitNodes<TIn, TInArray>(
   nodes, 
   visitor, 
   test?, 
   start?, 
   count?): NodeArray<Node> | TInArray & undefined
```

Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.

- If the input node array is undefined, the output is undefined.
- If the visitor can return undefined, the node it visits in the array will be reused.
- If the output node array is not undefined, then its contents will satisfy the test.
- In order to obtain a return type that is more specific than `NodeArray<Node>`, a test
  function _must_ be provided, and that function must be a type predicate.

### Type Parameters

• **TIn** *extends* [`Node`](../interfaces/Node.md)

• **TInArray** *extends* `undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<`TIn`\>

### Parameters

• **nodes**: `TInArray`

The NodeArray to visit.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`TIn`, `undefined` \| [`Node`](../interfaces/Node.md)\>

The callback used to visit a Node.

• **test?**

A node test to execute for each node.

• **start?**: `number`

An optional value indicating the starting offset at which to start visiting.

• **count?**: `number`

An optional value indicating the maximum number of nodes to visit.

### Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`Node`](../interfaces/Node.md)\> \| `TInArray` & `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9344
