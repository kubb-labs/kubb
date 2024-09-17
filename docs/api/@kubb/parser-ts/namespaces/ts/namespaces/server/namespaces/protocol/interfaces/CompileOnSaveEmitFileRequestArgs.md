[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CompileOnSaveEmitFileRequestArgs

# CompileOnSaveEmitFileRequestArgs

Arguments for CompileOnSaveEmitFileRequest

## Extends

- [`FileRequestArgs`](FileRequestArgs.md)

## Properties

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

### forced?

```ts
optional forced: boolean;
```

if true - then file should be recompiled even if it does not have any changes.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1434

***

### includeLinePosition?

```ts
optional includeLinePosition: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1435

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

### richResponse?

```ts
optional richResponse: boolean;
```

if true - return response as object with emitSkipped and diagnostics

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1437
