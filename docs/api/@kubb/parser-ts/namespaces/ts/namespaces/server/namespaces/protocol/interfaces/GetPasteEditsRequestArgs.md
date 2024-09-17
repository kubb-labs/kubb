[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GetPasteEditsRequestArgs

# GetPasteEditsRequestArgs

Arguments for FileRequest messages.

## Extends

- [`FileRequestArgs`](FileRequestArgs.md)

## Properties

### copiedFrom?

```ts
optional copiedFrom: object;
```

The source location of each `pastedText`. If present, the length of `spans` must be equal to the length of `pastedText`.

#### file

```ts
file: string;
```

#### spans

```ts
spans: TextSpan[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:513

***

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`file`](FileRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### pastedText

```ts
pastedText: string[];
```

The text that gets pasted in a file.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:507

***

### pasteLocations

```ts
pasteLocations: TextSpan[];
```

Locations of where the `pastedText` gets added in a file. If the length of the `pastedText` and `pastedLocations` are not the same,
 then the `pastedText` is combined into one and added at all the `pastedLocations`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:511

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`projectFileName`](FileRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242
