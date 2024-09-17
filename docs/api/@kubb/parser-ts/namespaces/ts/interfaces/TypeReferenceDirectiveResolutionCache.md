[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TypeReferenceDirectiveResolutionCache

# TypeReferenceDirectiveResolutionCache

Cached resolutions per containing directory.
This assumes that any module id will have the same resolution for sibling files located in the same folder.

## Extends

- [`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>.[`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>.[`PackageJsonInfoCache`](PackageJsonInfoCache.md)

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
   redirectedReference): undefined | ResolvedTypeReferenceDirectiveWithFailedLookupLocations
```

#### Parameters

• **name**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| [`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)

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
   redirectedReference): undefined | ResolvedTypeReferenceDirectiveWithFailedLookupLocations
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| [`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)

#### Inherited from

[`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md).[`getFromNonRelativeNameCache`](NonRelativeNameResolutionCache.md#getfromnonrelativenamecache)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9255

***

### getOrCreateCacheForDirectory()

```ts
getOrCreateCacheForDirectory(directoryName, redirectedReference?): ModeAwareCache<ResolvedTypeReferenceDirectiveWithFailedLookupLocations>
```

#### Parameters

• **directoryName**: `string`

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`ModeAwareCache`](ModeAwareCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>

#### Inherited from

[`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md).[`getOrCreateCacheForDirectory`](PerDirectoryResolutionCache.md#getorcreatecachefordirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9246

***

### getOrCreateCacheForNonRelativeName()

```ts
getOrCreateCacheForNonRelativeName(
   nonRelativeName, 
   mode, 
redirectedReference?): PerNonRelativeNameCache<ResolvedTypeReferenceDirectiveWithFailedLookupLocations>
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`PerNonRelativeNameCache`](PerNonRelativeNameCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>

#### Inherited from

[`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md).[`getOrCreateCacheForNonRelativeName`](NonRelativeNameResolutionCache.md#getorcreatecachefornonrelativename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9256

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

[`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md).[`update`](NonRelativeNameResolutionCache.md#update)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9252
