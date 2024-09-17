[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / NavtoRequestArgs

# NavtoRequestArgs

Arguments for navto request message.

## Properties

### currentFileOnly?

```ts
optional currentFileOnly: boolean;
```

Optional flag to indicate we want results for just the current file
or the entire project.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2204

***

### file?

```ts
optional file: string;
```

The file for the request (absolute pathname required).

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2199

***

### maxResultCount?

```ts
optional maxResultCount: number;
```

Optional limit on the number of items to return.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2195

***

### projectFileName?

```ts
optional projectFileName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2205

***

### searchValue

```ts
searchValue: string;
```

Search term to navigate to from current location; term can
be '.*' or an identifier prefix.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2191
