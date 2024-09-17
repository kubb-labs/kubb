[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ResolvedModule

# ResolvedModule

Represents the result of module resolution.
Module resolution will pick up tsx/jsx/js files even if '--jsx' and '--allowJs' are turned off.
The Program will then filter results based on these flags.

Prefer to return a `ResolvedModuleFull` so that the file type does not have to be inferred.

## Extended by

- [`ResolvedModuleFull`](ResolvedModuleFull.md)

## Properties

### isExternalLibraryImport?

```ts
optional isExternalLibraryImport: boolean;
```

True if `resolvedFileName` comes from `node_modules`.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7198

***

### resolvedFileName

```ts
resolvedFileName: string;
```

Path of the file the module was resolved to.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7196

***

### resolvedUsingTsExtension?

```ts
optional resolvedUsingTsExtension: boolean;
```

True if the original module reference used a .ts extension to refer directly to a .ts file,
which should produce an error during checking if emit is enabled.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7203
