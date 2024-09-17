[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ResolvedModuleFull

# ResolvedModuleFull

ResolvedModule with an explicitly provided `extension` property.
Prefer this over `ResolvedModule`.
If changing this, remember to change `moduleResolutionIsEqualTo`.

## Extends

- [`ResolvedModule`](ResolvedModule.md)

## Properties

### extension

```ts
extension: string;
```

Extension of resolvedFileName. This must match what's at the end of resolvedFileName.
This is optional for backwards-compatibility, but will be added if not provided.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7215

***

### isExternalLibraryImport?

```ts
optional isExternalLibraryImport: boolean;
```

True if `resolvedFileName` comes from `node_modules`.

#### Inherited from

[`ResolvedModule`](ResolvedModule.md).[`isExternalLibraryImport`](ResolvedModule.md#isexternallibraryimport)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7198

***

### packageId?

```ts
optional packageId: PackageId;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7216

***

### resolvedFileName

```ts
resolvedFileName: string;
```

Path of the file the module was resolved to.

#### Inherited from

[`ResolvedModule`](ResolvedModule.md).[`resolvedFileName`](ResolvedModule.md#resolvedfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7196

***

### resolvedUsingTsExtension?

```ts
optional resolvedUsingTsExtension: boolean;
```

True if the original module reference used a .ts extension to refer directly to a .ts file,
which should produce an error during checking if emit is enabled.

#### Inherited from

[`ResolvedModule`](ResolvedModule.md).[`resolvedUsingTsExtension`](ResolvedModule.md#resolvedusingtsextension)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7203
