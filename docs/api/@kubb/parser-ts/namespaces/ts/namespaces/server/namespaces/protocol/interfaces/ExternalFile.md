[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ExternalFile

# ExternalFile

Represents a file in external project.
External project is project whose set of files, compilation options and open\close state
is maintained by the client (i.e. if all this data come from .csproj file in Visual Studio).
External project will exist even if all files in it are closed and should be closed explicitly.
If external project includes one or more tsconfig.json/jsconfig.json files then tsserver will
create configured project for every config file but will maintain a link that these projects were created
as a result of opening external project so they should be removed once external project is closed.

## Properties

### content?

```ts
optional content: string;
```

Content of the file

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1034

***

### fileName

```ts
fileName: string;
```

Name of file file

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1022

***

### hasMixedContent?

```ts
optional hasMixedContent: boolean;
```

Whether file has mixed content (i.e. .cshtml file that combines html markup with C#/JavaScript)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1030

***

### scriptKind?

```ts
optional scriptKind: ScriptKind | ScriptKindName;
```

Script kind of the file

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1026
