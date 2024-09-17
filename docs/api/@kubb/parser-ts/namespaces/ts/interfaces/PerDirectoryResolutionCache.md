[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / PerDirectoryResolutionCache

# PerDirectoryResolutionCache\<T\>

Cached resolutions per containing directory.
This assumes that any module id will have the same resolution for sibling files located in the same folder.

## Extended by

- [`TypeReferenceDirectiveResolutionCache`](TypeReferenceDirectiveResolutionCache.md)
- [`ModuleResolutionCache`](ModuleResolutionCache.md)

## Type Parameters

• **T**

## Methods

### clear()

```ts
clear(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9247

***

### getFromDirectoryCache()

```ts
getFromDirectoryCache(
   name, 
   mode, 
   directoryName, 
   redirectedReference): undefined | T
```

#### Parameters

• **name**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| `T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9245

***

### getOrCreateCacheForDirectory()

```ts
getOrCreateCacheForDirectory(directoryName, redirectedReference?): ModeAwareCache<T>
```

#### Parameters

• **directoryName**: `string`

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`ModeAwareCache`](ModeAwareCache.md)\<`T`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9246

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9252
