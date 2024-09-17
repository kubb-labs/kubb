[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitParameterList

# visitParameterList()

## visitParameterList(nodes, visitor, context, nodesVisitor)

```ts
function visitParameterList(
   nodes, 
   visitor, 
   context, 
nodesVisitor?): NodeArray<ParameterDeclaration>
```

Starts a new lexical environment and visits a parameter list, suspending the lexical
environment upon completion.

### Parameters

• **nodes**: [`NodeArray`](../interfaces/NodeArray.md)\<[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)\>

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

• **nodesVisitor?**: [`NodesVisitor`](../interfaces/NodesVisitor.md)

### Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)\>

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9354

## visitParameterList(nodes, visitor, context, nodesVisitor)

```ts
function visitParameterList(
   nodes, 
   visitor, 
   context, 
   nodesVisitor?): NodeArray<ParameterDeclaration> | undefined
```

### Parameters

• **nodes**: `undefined` \| [`NodeArray`](../interfaces/NodeArray.md)\<[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)\>

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

• **nodesVisitor?**: [`NodesVisitor`](../interfaces/NodesVisitor.md)

### Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)\> \| `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9355
