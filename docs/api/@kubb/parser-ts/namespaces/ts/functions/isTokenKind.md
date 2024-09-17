[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / isTokenKind

# isTokenKind()

```ts
function isTokenKind(kind): boolean
```

True if kind is of some token syntax kind.
For example, this is true for an IfKeyword but not for an IfStatement.
Literals are considered tokens, except TemplateLiteral, but does include TemplateHead/Middle/Tail.

## Parameters

• **kind**: [`SyntaxKind`](../enumerations/SyntaxKind.md)

## Returns

`boolean`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8683
