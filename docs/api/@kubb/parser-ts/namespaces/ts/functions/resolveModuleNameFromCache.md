[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / resolveModuleNameFromCache

# resolveModuleNameFromCache()

```ts
function resolveModuleNameFromCache(
   moduleName, 
   containingFile, 
   cache, 
   mode?): ResolvedModuleWithFailedLookupLocations | undefined
```

## Parameters

• **moduleName**: `string`

• **containingFile**: `string`

• **cache**: [`ModuleResolutionCache`](../interfaces/ModuleResolutionCache.md)

• **mode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Returns

[`ResolvedModuleWithFailedLookupLocations`](../interfaces/ResolvedModuleWithFailedLookupLocations.md) \| `undefined`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9225
