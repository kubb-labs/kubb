[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CompletionEntryDataAutoImport

# CompletionEntryDataAutoImport

## Extended by

- [`CompletionEntryDataUnresolved`](CompletionEntryDataUnresolved.md)
- [`CompletionEntryDataResolved`](CompletionEntryDataResolved.md)

## Properties

### ambientModuleName?

```ts
optional ambientModuleName: string;
```

The module name (with quotes stripped) of the export's module symbol, if it was an ambient module

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10810

***

### exportMapKey?

```ts
optional exportMapKey: ExportMapInfoKey;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10805

***

### exportName

```ts
exportName: string;
```

The name of the property or export in the module's symbol table. Differs from the completion name
in the case of InternalSymbolName.ExportEquals and InternalSymbolName.Default.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10804

***

### fileName?

```ts
optional fileName: string;
```

The file name declaring the export's module symbol, if it was an external module

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10808

***

### isPackageJsonImport?

```ts
optional isPackageJsonImport: true;
```

True if the export was found in the package.json AutoImportProvider

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10812

***

### moduleSpecifier?

```ts
optional moduleSpecifier: string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10806
