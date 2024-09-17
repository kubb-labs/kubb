[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / OpenRequestArgs

# OpenRequestArgs

Information found in an "open" request.

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

### fileContent?

```ts
optional fileContent: string;
```

Used when a version of the file content is known to be more up to date than the one on disk.
Then the known content will be used upon opening instead of the disk copy

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1215

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

### projectRootPath?

```ts
optional projectRootPath: string;
```

Used to limit the searching for project config file. If given the searching will stop at this
root path; otherwise it will go all the way up to the dist root path.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1225

***

### scriptKindName?

```ts
optional scriptKindName: ScriptKindName;
```

Used to specify the script kind of the file explicitly. It could be one of the following:
     "TS", "JS", "TSX", "JSX"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1220
