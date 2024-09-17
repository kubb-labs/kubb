[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / addSyntheticTrailingComment

# addSyntheticTrailingComment()

```ts
function addSyntheticTrailingComment<T>(
   node, 
   kind, 
   text, 
   hasTrailingNewLine?): T
```

## Type Parameters

• **T** *extends* [`Node`](../interfaces/Node.md)

## Parameters

• **node**: `T`

• **kind**: [`SingleLineCommentTrivia`](../enumerations/SyntaxKind.md#singlelinecommenttrivia) \| [`MultiLineCommentTrivia`](../enumerations/SyntaxKind.md#multilinecommenttrivia)

• **text**: `string`

• **hasTrailingNewLine?**: `boolean`

## Returns

`T`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8828
