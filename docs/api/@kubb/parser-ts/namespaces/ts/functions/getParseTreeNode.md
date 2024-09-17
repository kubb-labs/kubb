[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getParseTreeNode

# getParseTreeNode()

## getParseTreeNode(node)

```ts
function getParseTreeNode(node): Node | undefined
```

Gets the original parse tree node for a node.

### Parameters

• **node**: `undefined` \| [`Node`](../interfaces/Node.md)

The original node.

### Returns

[`Node`](../interfaces/Node.md) \| `undefined`

The original parse tree node if found; otherwise, undefined.

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8538

## getParseTreeNode(node, nodeTest)

```ts
function getParseTreeNode<T>(node, nodeTest?): T | undefined
```

Gets the original parse tree node for a node.

### Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

### Parameters

• **node**: `undefined` \| `T`

The original node.

• **nodeTest?**

A callback used to ensure the correct type of parse tree node is returned.

### Returns

`T` \| `undefined`

The original parse tree node if found; otherwise, undefined.

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8546
