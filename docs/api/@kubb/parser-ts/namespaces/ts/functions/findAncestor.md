[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / findAncestor

# findAncestor()

## findAncestor(node, callback)

```ts
function findAncestor<T>(node, callback): T | undefined
```

Iterates through the parent chain of a node and performs the callback on each parent until the callback
returns a truthy value, then returns that value.
If no such value is found, it applies the callback until the parent pointer is undefined or the callback returns "quit"
At that point findAncestor returns undefined.

### Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `undefined` \| [`Node`](../interfaces/Node.md)

• **callback**

### Returns

`T` \| `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8524

## findAncestor(node, callback)

```ts
function findAncestor(node, callback): Node | undefined
```

### Parameters

• **node**: `undefined` \| [`Node`](../interfaces/Node.md)

• **callback**

### Returns

[`Node`](../interfaces/Node.md) \| `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8525
