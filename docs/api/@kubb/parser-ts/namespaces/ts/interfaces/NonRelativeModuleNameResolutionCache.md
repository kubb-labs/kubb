[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NonRelativeModuleNameResolutionCache

# NonRelativeModuleNameResolutionCache

Stored map from non-relative module name to a table: directory -> result of module lookup in this directory
We support only non-relative module names because resolution of relative module names is usually more deterministic and thus less expensive.

## Extends

- [`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md)\<[`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)\>.[`PackageJsonInfoCache`](PackageJsonInfoCache.md)

## Extended by

- [`ModuleResolutionCache`](ModuleResolutionCache.md)

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9257

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

[`NonRelativeNameResolutionCache`](NonRelativeNameResolutionCache.md).[`getFromNonRelativeNameCache`](NonRelativeNameResolutionCache.md#getfromnonrelativenamecache)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9255

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9262
