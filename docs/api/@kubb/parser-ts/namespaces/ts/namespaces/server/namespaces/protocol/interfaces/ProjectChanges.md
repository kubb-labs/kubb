[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ProjectChanges

# ProjectChanges

Represents a set of changes that happen in project

## Properties

### added

```ts
added: string[] | FileWithProjectReferenceRedirectInfo[];
```

List of added files

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1085

***

### removed

```ts
removed: string[] | FileWithProjectReferenceRedirectInfo[];
```

List of removed files

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1089

***

### updated

```ts
updated: string[] | FileWithProjectReferenceRedirectInfo[];
```

List of updated files

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1093

***

### updatedRedirects?

```ts
optional updatedRedirects: FileWithProjectReferenceRedirectInfo[];
```

List of files that have had their project reference redirect status updated
Only provided when the synchronizeProjectList request has includeProjectReferenceRedirectInfo set to true

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1098
