[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getJSDocReturnType

# getJSDocReturnType()

```ts
function getJSDocReturnType(node): TypeNode | undefined
```

Gets the return type node for the node if provided via JSDoc return tag or type tag.

## Parameters

• **node**: [`Node`](../interfaces/Node.md)

## Returns

[`TypeNode`](../interfaces/TypeNode.md) \| `undefined`

## Remarks

`getJSDocReturnTag` just gets the whole JSDoc tag. This function
gets the type from inside the braces, after the fat arrow, etc.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8644
