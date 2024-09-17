[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CompletionEntryDataResolved

# CompletionEntryDataResolved

## Extends

- [`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md)

## Properties

### ambientModuleName?

```ts
optional ambientModuleName: string;
```

The module name (with quotes stripped) of the export's module symbol, if it was an ambient module

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`ambientModuleName`](CompletionEntryDataAutoImport.md#ambientmodulename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10810

***

### exportMapKey?

```ts
optional exportMapKey: ExportMapInfoKey;
```

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`exportMapKey`](CompletionEntryDataAutoImport.md#exportmapkey)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10805

***

### exportName

```ts
exportName: string;
```

The name of the property or export in the module's symbol table. Differs from the completion name
in the case of InternalSymbolName.ExportEquals and InternalSymbolName.Default.

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`exportName`](CompletionEntryDataAutoImport.md#exportname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10804

***

### fileName?

```ts
optional fileName: string;
```

The file name declaring the export's module symbol, if it was an external module

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`fileName`](CompletionEntryDataAutoImport.md#filename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10808

***

### isPackageJsonImport?

```ts
optional isPackageJsonImport: true;
```

True if the export was found in the package.json AutoImportProvider

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`isPackageJsonImport`](CompletionEntryDataAutoImport.md#ispackagejsonimport)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10812

***

### moduleSpecifier

```ts
moduleSpecifier: string;
```

#### Overrides

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`moduleSpecifier`](CompletionEntryDataAutoImport.md#modulespecifier)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:10818
