[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / identifierToKeywordKind

# identifierToKeywordKind()

```ts
function identifierToKeywordKind(node): KeywordSyntaxKind | undefined
```

If the text of an Identifier matches a keyword (including contextual and TypeScript-specific keywords), returns the
SyntaxKind for the matching keyword.

## Parameters

• **node**: [`Identifier`](../interfaces/Identifier.md)

## Returns

[`KeywordSyntaxKind`](../type-aliases/KeywordSyntaxKind.md) \| `undefined`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8561
