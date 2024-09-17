[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / resolveModuleName

# resolveModuleName()

```ts
function resolveModuleName(
   moduleName, 
   containingFile, 
   compilerOptions, 
   host, 
   cache?, 
   redirectedReference?, 
   resolutionMode?): ResolvedModuleWithFailedLookupLocations
```

## Parameters

• **moduleName**: `string`

• **containingFile**: `string`

• **compilerOptions**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host**: [`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

• **cache?**: [`ModuleResolutionCache`](../interfaces/ModuleResolutionCache.md)

• **redirectedReference?**: [`ResolvedProjectReference`](../interfaces/ResolvedProjectReference.md)

• **resolutionMode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Returns

[`ResolvedModuleWithFailedLookupLocations`](../interfaces/ResolvedModuleWithFailedLookupLocations.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9226
