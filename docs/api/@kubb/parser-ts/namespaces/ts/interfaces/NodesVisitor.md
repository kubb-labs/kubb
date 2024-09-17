[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NodesVisitor

# NodesVisitor()

A function that walks a node array using the given visitor, returning an array whose contents satisfy the test.

- If the input node array is undefined, the output is undefined.
- If the visitor can return undefined, the node it visits in the array will be reused.
- If the output node array is not undefined, then its contents will satisfy the test.
- In order to obtain a return type that is more specific than `NodeArray<Node>`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## See

.

```ts
interface NodesVisitor<TIn, TInArray, TOut>(
   nodes, 
   visitor, 
   test, 
   start?, 
   count?): NodeArray<TOut> | TInArray & undefined
```

A function that walks a node array using the given visitor, returning an array whose contents satisfy the test.

- If the input node array is undefined, the output is undefined.
- If the visitor can return undefined, the node it visits in the array will be reused.
- If the output node array is not undefined, then its contents will satisfy the test.
- In order to obtain a return type that is more specific than `NodeArray<Node>`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## Type Parameters

• **TIn** *extends* [`Node`](Node.md)

• **TInArray** *extends* `undefined` \| [`NodeArray`](NodeArray.md)\<`TIn`\>

• **TOut** *extends* [`Node`](Node.md)

## Parameters

• **nodes**: `TInArray`

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`TIn`, `undefined` \| [`Node`](Node.md)\>

• **test**

• **start?**: `number`

• **count?**: `number`

## Returns

[`NodeArray`](NodeArray.md)\<`TOut`\> \| `TInArray` & `undefined`

## See

.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8001

```ts
interface NodesVisitor<TIn, TInArray>(
   nodes, 
   visitor, 
   test?, 
   start?, 
   count?): NodeArray<Node> | TInArray & undefined
```

A function that walks a node array using the given visitor, returning an array whose contents satisfy the test.

- If the input node array is undefined, the output is undefined.
- If the visitor can return undefined, the node it visits in the array will be reused.
- If the output node array is not undefined, then its contents will satisfy the test.
- In order to obtain a return type that is more specific than `NodeArray<Node>`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## Type Parameters

• **TIn** *extends* [`Node`](Node.md)

• **TInArray** *extends* `undefined` \| [`NodeArray`](NodeArray.md)\<`TIn`\>

## Parameters

• **nodes**: `TInArray`

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`TIn`, `undefined` \| [`Node`](Node.md)\>

• **test?**

• **start?**: `number`

• **count?**: `number`

## Returns

[`NodeArray`](NodeArray.md)\<[`Node`](Node.md)\> \| `TInArray` & `undefined`

## See

.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8002
