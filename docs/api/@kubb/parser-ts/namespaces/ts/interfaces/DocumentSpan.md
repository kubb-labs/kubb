[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / DocumentSpan

# DocumentSpan

## Extended by

- [`RenameLocation`](RenameLocation.md)
- [`ReferenceEntry`](ReferenceEntry.md)
- [`ImplementationLocation`](ImplementationLocation.md)
- [`DefinitionInfo`](DefinitionInfo.md)

## Properties

### contextSpan?

```ts
optional contextSpan: TextSpan;
```

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10509

***

### fileName

```ts
fileName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10498

***

### originalContextSpan?

```ts
optional originalContextSpan: TextSpan;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10510

***

### originalFileName?

```ts
optional originalFileName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10504

***

### originalTextSpan?

```ts
optional originalTextSpan: TextSpan;
```

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10503

***

### textSpan

```ts
textSpan: TextSpan;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10497
