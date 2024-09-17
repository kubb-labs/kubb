[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / SignatureHelpItem

# SignatureHelpItem

Represents a single signature to show in signature help.
The id is used for subsequent calls into the language service to ask questions about the
signature help item in the context of any documents that have been updated.  i.e. after
an edit has happened, while signature help is still active, the host can ask important
questions like 'what parameter is the user currently contained within?'.

## Properties

### documentation

```ts
documentation: SymbolDisplayPart[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10751

***

### isVariadic

```ts
isVariadic: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10746

***

### parameters

```ts
parameters: SignatureHelpParameter[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10750

***

### prefixDisplayParts

```ts
prefixDisplayParts: SymbolDisplayPart[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10747

***

### separatorDisplayParts

```ts
separatorDisplayParts: SymbolDisplayPart[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10749

***

### suffixDisplayParts

```ts
suffixDisplayParts: SymbolDisplayPart[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10748

***

### tags

```ts
tags: JSDocTagInfo[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10752
