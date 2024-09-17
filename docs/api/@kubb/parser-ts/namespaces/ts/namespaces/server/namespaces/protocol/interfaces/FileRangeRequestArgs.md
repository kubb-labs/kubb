[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileRangeRequestArgs

# FileRangeRequestArgs

Arguments for FileRequest messages.

## Extends

- [`FileRequestArgs`](FileRequestArgs.md).[`FileRange`](FileRange.md)

## Extended by

- [`CodeFixRequestArgs`](CodeFixRequestArgs.md)

## Properties

### endLine

```ts
endLine: number;
```

The line number for the request (1-based).

#### Inherited from

[`FileRange`](FileRange.md).[`endLine`](FileRange.md#endline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1902

***

### endOffset

```ts
endOffset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FileRange`](FileRange.md).[`endOffset`](FileRange.md#endoffset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1906

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

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileRequestArgs`](FileRequestArgs.md).[`projectFileName`](FileRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242

***

### startLine

```ts
startLine: number;
```

The line number for the request (1-based).

#### Inherited from

[`FileRange`](FileRange.md).[`startLine`](FileRange.md#startline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1894

***

### startOffset

```ts
startOffset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FileRange`](FileRange.md).[`startOffset`](FileRange.md#startoffset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1898
