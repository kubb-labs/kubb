[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / RefactorEditInfo

# RefactorEditInfo

A set of edits to make in response to a refactor action, plus an optional
location where renaming should be invoked from

## Properties

### commands?

```ts
optional commands: InstallPackageAction[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10487

***

### edits

```ts
edits: FileTextChanges[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10484

***

### notApplicableReason?

```ts
optional notApplicableReason: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10488

***

### renameFilename?

```ts
optional renameFilename: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10485

***

### renameLocation?

```ts
optional renameLocation: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10486
