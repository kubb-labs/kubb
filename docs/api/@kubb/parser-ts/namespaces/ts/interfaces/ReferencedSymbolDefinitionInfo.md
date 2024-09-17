[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ReferencedSymbolDefinitionInfo

# ReferencedSymbolDefinitionInfo

## Extends

- [`DefinitionInfo`](DefinitionInfo.md)

## Properties

### containerKind

```ts
containerKind: ScriptElementKind;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`containerKind`](DefinitionInfo.md#containerkind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10620

***

### containerName

```ts
containerName: string;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`containerName`](DefinitionInfo.md#containername)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10621

***

### contextSpan?

```ts
optional contextSpan: TextSpan;
```

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`contextSpan`](DefinitionInfo.md#contextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10509

***

### displayParts

```ts
displayParts: SymbolDisplayPart[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10629

***

### fileName

```ts
fileName: string;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`fileName`](DefinitionInfo.md#filename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10498

***

### kind

```ts
kind: ScriptElementKind;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`kind`](DefinitionInfo.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10618

***

### name

```ts
name: string;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`name`](DefinitionInfo.md#name)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10619

***

### originalContextSpan?

```ts
optional originalContextSpan: TextSpan;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`originalContextSpan`](DefinitionInfo.md#originalcontextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10510

***

### originalFileName?

```ts
optional originalFileName: string;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`originalFileName`](DefinitionInfo.md#originalfilename)

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

[`DefinitionInfo`](DefinitionInfo.md).[`originalTextSpan`](DefinitionInfo.md#originaltextspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10503

***

### textSpan

```ts
textSpan: TextSpan;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`textSpan`](DefinitionInfo.md#textspan)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10497

***

### unverified?

```ts
optional unverified: boolean;
```

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`unverified`](DefinitionInfo.md#unverified)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10622
