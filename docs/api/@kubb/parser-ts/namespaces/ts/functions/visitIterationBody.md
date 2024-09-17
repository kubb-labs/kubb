[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitIterationBody

# visitIterationBody()

```ts
function visitIterationBody(
   body, 
   visitor, 
   context): Statement
```

Visits an iteration body, adding any block-scoped variables required by the transformation.

## Parameters

• **body**: [`Statement`](../interfaces/Statement.md)

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

## Returns

[`Statement`](../interfaces/Statement.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9374
