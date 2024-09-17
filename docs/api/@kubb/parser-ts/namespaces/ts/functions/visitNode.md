[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitNode

# visitNode()

## visitNode(node, visitor, test, lift)

```ts
function visitNode<TIn, TVisited, TOut>(
   node, 
   visitor, 
   test, 
   lift?): TOut | TIn & undefined | TVisited & undefined
```

Visits a Node using the supplied visitor, possibly returning a new Node in its place.

- If the input node is undefined, then the output is undefined.
- If the visitor returns undefined, then the output is undefined.
- If the output node is not undefined, then it will satisfy the test function.
- In order to obtain a return type that is more specific than `Node`, a test
  function _must_ be provided, and that function must be a type predicate.

### Type Parameters

• **TIn** *extends* `undefined` \| [`Node`](../interfaces/Node.md)

• **TVisited** *extends* `undefined` \| [`Node`](../interfaces/Node.md)

• **TOut** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `TIn`

The Node to visit.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`NonNullable`\<`TIn`\>, `TVisited`\>

The callback used to visit the Node.

• **test**

A callback to execute to verify the Node is valid.

• **lift?**

An optional callback to execute to lift a NodeArray into a valid Node.

### Returns

`TOut` \| `TIn` & `undefined` \| `TVisited` & `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9297

## visitNode(node, visitor, test, lift)

```ts
function visitNode<TIn, TVisited>(
   node, 
   visitor, 
   test?, 
   lift?): Node | TIn & undefined | TVisited & undefined
```

Visits a Node using the supplied visitor, possibly returning a new Node in its place.

- If the input node is undefined, then the output is undefined.
- If the visitor returns undefined, then the output is undefined.
- If the output node is not undefined, then it will satisfy the test function.
- In order to obtain a return type that is more specific than `Node`, a test
  function _must_ be provided, and that function must be a type predicate.

### Type Parameters

• **TIn** *extends* `undefined` \| [`Node`](../interfaces/Node.md)

• **TVisited** *extends* `undefined` \| [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `TIn`

The Node to visit.

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<`NonNullable`\<`TIn`\>, `TVisited`\>

The callback used to visit the Node.

• **test?**

A callback to execute to verify the Node is valid.

• **lift?**

An optional callback to execute to lift a NodeArray into a valid Node.

### Returns

[`Node`](../interfaces/Node.md) \| `TIn` & `undefined` \| `TVisited` & `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9312
