[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ModuleResolutionCache

# ModuleResolutionCache

Cached resolutions per containing directory.
This assumes that any module id will have the same resolution for sibling files located in the same folder.

## Extends

- [`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md)\<[`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)\>.[`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md).[`PackageJsonInfoCache`](PackageJsonInfoCache.md)

## Methods

### clear()

```ts
clear(): void
```

#### Returns

`void`

#### Inherited from

[`PackageJsonInfoCache`](PackageJsonInfoCache.md).[`clear`](PackageJsonInfoCache.md#clear)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9247

***

### getFromDirectoryCache()

```ts
getFromDirectoryCache(
   name, 
   mode, 
   directoryName, 
   redirectedReference): undefined | ResolvedModuleWithFailedLookupLocations
```

#### Parameters

• **name**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)

#### Inherited from

[`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md).[`getFromDirectoryCache`](PerDirectoryResolutionCache.md#getfromdirectorycache)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9245

***

### getFromNonRelativeNameCache()

```ts
getFromNonRelativeNameCache(
   nonRelativeName, 
   mode, 
   directoryName, 
   redirectedReference): undefined | ResolvedModuleWithFailedLookupLocations
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)

#### Inherited from

[`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md).[`getFromNonRelativeNameCache`](NonRelativeModuleNameResolutionCache.md#getfromnonrelativenamecache)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9255

***

### getOrCreateCacheForDirectory()

```ts
getOrCreateCacheForDirectory(directoryName, redirectedReference?): ModeAwareCache<ResolvedModuleWithFailedLookupLocations>
```

#### Parameters

• **directoryName**: `string`

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`ModeAwareCache`](ModeAwareCache.md)\<[`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)\>

#### Inherited from

[`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md).[`getOrCreateCacheForDirectory`](PerDirectoryResolutionCache.md#getorcreatecachefordirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9246

***

### ~~getOrCreateCacheForModuleName()~~

```ts
getOrCreateCacheForModuleName(
   nonRelativeModuleName, 
   mode, 
   redirectedReference?): PerModuleNameCache
```

#### Parameters

• **nonRelativeModuleName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`PerModuleNameCache`](../type-aliases/PerModuleNameCache.md)

#### Deprecated

Use getOrCreateCacheForNonRelativeName

#### Inherited from

[`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md).[`getOrCreateCacheForModuleName`](NonRelativeModuleNameResolutionCache.md#getorcreatecacheformodulename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9277

***

### getOrCreateCacheForNonRelativeName()

```ts
getOrCreateCacheForNonRelativeName(
   nonRelativeName, 
   mode, 
redirectedReference?): PerNonRelativeNameCache<ResolvedModuleWithFailedLookupLocations>
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`PerNonRelativeNameCache`](PerNonRelativeNameCache.md)\<[`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)\>

#### Inherited from

[`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md).[`getOrCreateCacheForNonRelativeName`](NonRelativeModuleNameResolutionCache.md#getorcreatecachefornonrelativename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9256

***

### getPackageJsonInfoCache()

```ts
getPackageJsonInfoCache(): PackageJsonInfoCache
```

#### Returns

[`PackageJsonInfoCache`](PackageJsonInfoCache.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9269

***

### update()

```ts
update(options): void
```

Updates with the current compilerOptions the cache will operate with.
 This updates the redirects map as well if needed so module resolutions are cached if they can across the projects

#### Parameters

• **options**: [`CompilerOptions`](CompilerOptions.md)

#### Returns

`void`

#### Inherited from

[`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md).[`update`](NonRelativeModuleNameResolutionCache.md#update)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9252
