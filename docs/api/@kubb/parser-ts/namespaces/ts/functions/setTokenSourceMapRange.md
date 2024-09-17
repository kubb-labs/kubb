[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / setTokenSourceMapRange

# setTokenSourceMapRange()

```ts
function setTokenSourceMapRange<T>(
   node, 
   token, 
   range): T
```

Sets the TextRange to use for source maps for a token of a node.

## Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

## Parameters

• **node**: `T`

• **token**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

• **range**: `undefined` \| [`SourceMapRange`](../interfaces/SourceMapRange.md)

## Returns

`T`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8814
