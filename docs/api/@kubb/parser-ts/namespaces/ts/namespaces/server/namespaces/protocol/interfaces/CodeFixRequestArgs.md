[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CodeFixRequestArgs

# CodeFixRequestArgs

Instances of this interface specify errorcodes on a specific location in a sourcefile.

## Extends

- [`FileRangeRequestArgs`](FileRangeRequestArgs.md)

## Properties

### endLine

```ts
endLine: number;
```

The line number for the request (1-based).

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`endLine`](FileRangeRequestArgs.md#endline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1902

***

### endOffset

```ts
endOffset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`endOffset`](FileRangeRequestArgs.md#endoffset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1906

***

### errorCodes

```ts
errorCodes: readonly number[];
```

Errorcodes we want to get the fixes for.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:612

***

### file

```ts
file: string;
```

The file for the request (absolute pathname required).

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`file`](FileRangeRequestArgs.md#file)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:241

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`projectFileName`](FileRangeRequestArgs.md#projectfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:242

***

### startLine

```ts
startLine: number;
```

The line number for the request (1-based).

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`startLine`](FileRangeRequestArgs.md#startline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1894

***

### startOffset

```ts
startOffset: number;
```

The character offset (on the line) for the request (1-based).

#### Inherited from

[`FileRangeRequestArgs`](FileRangeRequestArgs.md).[`startOffset`](FileRangeRequestArgs.md#startoffset)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1898
