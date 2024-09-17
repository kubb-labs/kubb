[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ProjectInfo

# ProjectInfo

Response message body for "projectInfo" request

## Properties

### configFileName

```ts
configFileName: string;
```

For configured project, this is the normalized path of the 'tsconfig.json' file
For inferred project, this is undefined

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:397

***

### fileNames?

```ts
optional fileNames: string[];
```

The list of normalized file name in the project, including 'lib.d.ts'

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:401

***

### languageServiceDisabled?

```ts
optional languageServiceDisabled: boolean;
```

Indicates if the project has a active language service instance

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:405
