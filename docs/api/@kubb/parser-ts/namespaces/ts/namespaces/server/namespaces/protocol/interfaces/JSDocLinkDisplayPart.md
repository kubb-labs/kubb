[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / JSDocLinkDisplayPart

# JSDocLinkDisplayPart

A part of a symbol description that links from a jsdoc

## Link

tag to a declaration

## Extends

- [`SymbolDisplayPart`](SymbolDisplayPart.md)

## Properties

### kind

```ts
kind: string;
```

The symbol's kind (such as 'className' or 'parameterName' or plain 'text').

#### Inherited from

[`SymbolDisplayPart`](SymbolDisplayPart.md).[`kind`](SymbolDisplayPart.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10673

***

### target

```ts
target: FileSpan;
```

The location of the declaration that the

#### Link

tag links to.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1665

***

### text

```ts
text: string;
```

Text of an item describing the symbol.

#### Inherited from

[`SymbolDisplayPart`](SymbolDisplayPart.md).[`text`](SymbolDisplayPart.md#text)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10669
