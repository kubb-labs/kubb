[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ReferencedSymbolEntry

# ReferencedSymbolEntry

## Extends

- [`ReferenceEntry`](ReferenceEntry.md)

## Properties

### contextSpan?

```ts
optional contextSpan: TextSpan;
```

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`contextSpan`](ReferenceEntry.md#contextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10509

***

### fileName

```ts
fileName: string;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`fileName`](ReferenceEntry.md#filename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10498

***

### isDefinition?

```ts
optional isDefinition: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10636

***

### isInString?

```ts
optional isInString: true;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`isInString`](ReferenceEntry.md#isinstring)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10518

***

### isWriteAccess

```ts
isWriteAccess: boolean;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`isWriteAccess`](ReferenceEntry.md#iswriteaccess)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10517

***

### originalContextSpan?

```ts
optional originalContextSpan: TextSpan;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalContextSpan`](ReferenceEntry.md#originalcontextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10510

***

### originalFileName?

```ts
optional originalFileName: string;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalFileName`](ReferenceEntry.md#originalfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10504

***

### originalTextSpan?

```ts
optional originalTextSpan: TextSpan;
```

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalTextSpan`](ReferenceEntry.md#originaltextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10503

***

### textSpan

```ts
textSpan: TextSpan;
```

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`textSpan`](ReferenceEntry.md#textspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10497
