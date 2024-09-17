[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / NonRelativeNameResolutionCache

# NonRelativeNameResolutionCache\<T\>

## Extended by

- [`TypeReferenceDirectiveResolutionCache`](TypeReferenceDirectiveResolutionCache.md)
- [`NonRelativeModuleNameResolutionCache`](NonRelativeModuleNameResolutionCache.md)

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9257

***

### getFromNonRelativeNameCache()

```ts
getFromNonRelativeNameCache(
   nonRelativeName, 
   mode, 
   directoryName, 
   redirectedReference): undefined | T
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **directoryName**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

`undefined` \| `T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9255

***

### getOrCreateCacheForNonRelativeName()

```ts
getOrCreateCacheForNonRelativeName(
   nonRelativeName, 
   mode, 
redirectedReference?): PerNonRelativeNameCache<T>
```

#### Parameters

• **nonRelativeName**: `string`

• **mode**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

• **redirectedReference?**: [`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`PerNonRelativeNameCache`](PerNonRelativeNameCache.md)\<`T`\>

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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9262
