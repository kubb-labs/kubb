[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitLexicalEnvironment

# visitLexicalEnvironment()

```ts
function visitLexicalEnvironment(
   statements, 
   visitor, 
   context, 
   start?, 
   ensureUseStrict?, 
nodesVisitor?): NodeArray<Statement>
```

Starts a new lexical environment and visits a statement list, ending the lexical environment
and merging hoisted declarations upon completion.

## Parameters

• **statements**: [`NodeArray`](../interfaces/NodeArray.md)\<[`Statement`](../interfaces/Statement.md)\>

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

• **start?**: `number`

• **ensureUseStrict?**: `boolean`

• **nodesVisitor?**: [`NodesVisitor`](../interfaces/NodesVisitor.md)

## Returns

[`NodeArray`](../interfaces/NodeArray.md)\<[`Statement`](../interfaces/Statement.md)\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9349
