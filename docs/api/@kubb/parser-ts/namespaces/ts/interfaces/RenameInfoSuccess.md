[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / RenameInfoSuccess

# RenameInfoSuccess

## Properties

### canRename

```ts
canRename: true;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10692

***

### displayName

```ts
displayName: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10698

***

### fileToRename?

```ts
optional fileToRename: string;
```

File or directory to rename.
If set, `getEditsForFileRename` should be called instead of `findRenameLocations`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10697

***

### fullDisplayName

```ts
fullDisplayName: string;
```

Full display name of item to be renamed.
If item to be renamed is a file, then this is the original text of the module specifer

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10703

***

### kind

```ts
kind: ScriptElementKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10704

***

### kindModifiers

```ts
kindModifiers: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10705

***

### triggerSpan

```ts
triggerSpan: TextSpan;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10706
