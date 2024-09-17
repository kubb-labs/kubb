[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / QuickInfoResponseBody

# QuickInfoResponseBody

Body of QuickInfoResponse.

## Properties

### displayString

```ts
displayString: string;
```

Type and kind of symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1479

***

### documentation

```ts
documentation: string | SymbolDisplayPart[];
```

Documentation associated with symbol.
Display parts when UserPreferences.displayPartsForJSDoc is true, flattened to string otherwise.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1484

***

### end

```ts
end: Location;
```

One past last character of symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1475

***

### kind

```ts
kind: ScriptElementKind;
```

The symbol's kind (such as 'className' or 'parameterName' or plain 'text').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1463

***

### kindModifiers

```ts
kindModifiers: string;
```

Optional modifiers for the kind (such as 'public').

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1467

***

### start

```ts
start: Location;
```

Starting file location of symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1471

***

### tags

```ts
tags: JSDocTagInfo[];
```

JSDoc tags associated with symbol.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1488
