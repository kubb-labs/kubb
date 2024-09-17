[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getJSDocType

# getJSDocType()

```ts
function getJSDocType(node): TypeNode | undefined
```

Gets the type node for the node if provided via JSDoc.

## Parameters

• **node**: [`Node`](../interfaces/Node.md)

## Returns

[`TypeNode`](../interfaces/TypeNode.md) \| `undefined`

## Remarks

The search includes any JSDoc param tag that relates
to the provided parameter, for example a type tag on the
parameter itself, or a param tag on a containing function
expression, or a param tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are examined first, so in the previous example, the type
tag directly on the node would be returned.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8637
