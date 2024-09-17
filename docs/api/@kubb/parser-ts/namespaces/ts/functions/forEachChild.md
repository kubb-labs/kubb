[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / forEachChild

# forEachChild()

```ts
function forEachChild<T>(
   node, 
   cbNode, 
   cbNodes?): T | undefined
```

Invokes a callback for each child of the given node. The 'cbNode' callback is invoked for all child nodes
stored in properties. If a 'cbNodes' callback is specified, it is invoked for embedded arrays; otherwise,
embedded arrays are flattened and the 'cbNode' callback is invoked for each element. If a callback returns
a truthy value, iteration stops and that value is returned. Otherwise, undefined is returned.

## Type Parameters

• **T**

## Parameters

• **node**: [`Node`](../interfaces/Node.md)

a given node to visit its children

• **cbNode**

a callback to be invoked for all child nodes

• **cbNodes?**

a callback to be invoked for embedded array

## Returns

`T` \| `undefined`

## Remarks

`forEachChild` must visit the children of a node in the order
that they appear in the source code. The language service depends on this property to locate nodes by position.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9095
