[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NodeVisitor

# NodeVisitor()

A function that walks a node using the given visitor, lifting node arrays into single nodes,
returning an node which satisfies the test.

- If the input node is undefined, then the output is undefined.
- If the visitor returns undefined, then the output is undefined.
- If the output node is not undefined, then it will satisfy the test function.
- In order to obtain a return type that is more specific than `Node`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## See

.

```ts
interface NodeVisitor<TIn, TVisited, TOut>(
   node, 
   visitor, 
   test, 
   lift?): TOut | TIn & undefined | TVisited & undefined
```

A function that walks a node using the given visitor, lifting node arrays into single nodes,
returning an node which satisfies the test.

- If the input node is undefined, then the output is undefined.
- If the visitor returns undefined, then the output is undefined.
- If the output node is not undefined, then it will satisfy the test function.
- In order to obtain a return type that is more specific than `Node`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## Type Parameters

• **TIn** *extends* `undefined` \| [`Node`](Node.md)

• **TVisited** *extends* `undefined` \| [`Node`](Node.md)

• **TOut** *extends* [`Node`](Node.md)

## Parameters

• **node**: `TIn`

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`NonNullable`\<`TIn`\>, `TVisited`\>

• **test**

• **lift?**

## Returns

`TOut` \| `TIn` & `undefined` \| `TVisited` & `undefined`

## See

.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7986

```ts
interface NodeVisitor<TIn, TVisited>(
   node, 
   visitor, 
   test?, 
   lift?): Node | TIn & undefined | TVisited & undefined
```

A function that walks a node using the given visitor, lifting node arrays into single nodes,
returning an node which satisfies the test.

- If the input node is undefined, then the output is undefined.
- If the visitor returns undefined, then the output is undefined.
- If the output node is not undefined, then it will satisfy the test function.
- In order to obtain a return type that is more specific than `Node`, a test
  function _must_ be provided, and that function must be a type predicate.

For the canonical implementation of this type,

## Type Parameters

• **TIn** *extends* `undefined` \| [`Node`](Node.md)

• **TVisited** *extends* `undefined` \| [`Node`](Node.md)

## Parameters

• **node**: `TIn`

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`NonNullable`\<`TIn`\>, `TVisited`\>

• **test?**

• **lift?**

## Returns

[`Node`](Node.md) \| `TIn` & `undefined` \| `TVisited` & `undefined`

## See

.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7987
