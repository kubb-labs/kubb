[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitCommaListElements

# visitCommaListElements()

```ts
function visitCommaListElements(
   elements, 
   visitor, 
discardVisitor?): NodeArray<Expression>
```

Visits the elements of a [CommaListExpression](../interfaces/CommaListExpression.md).

## Parameters

• **elements**: [`NodeArray`](../interfaces/NodeArray.md)\<[`Expression`](../interfaces/Expression.md)\>

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

The visitor to use when visiting expressions whose result will not be discarded at runtime.

• **discardVisitor?**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

The visitor to use when visiting expressions whose result will be discarded at runtime. Defaults to visitor.

## Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`Expression`](../interfaces/Expression.md)\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9380
