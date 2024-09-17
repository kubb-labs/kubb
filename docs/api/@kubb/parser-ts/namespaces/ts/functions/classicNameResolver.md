[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / classicNameResolver

# classicNameResolver()

```ts
function classicNameResolver(
   moduleName, 
   containingFile, 
   compilerOptions, 
   host, 
   cache?, 
   redirectedReference?): ResolvedModuleWithFailedLookupLocations
```

## Parameters

• **moduleName**: `string`

• **containingFile**: `string`

• **compilerOptions**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host**: [`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

• **cache?**: [`NonRelativeModuleNameResolutionCache`](../interfaces/NonRelativeModuleNameResolutionCache.md)

• **redirectedReference?**: [`ResolvedProjectReference`](../interfaces/ResolvedProjectReference.md)

## Returns

[`ResolvedModuleWithFailedLookupLocations`](../interfaces/ResolvedModuleWithFailedLookupLocations.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9229
