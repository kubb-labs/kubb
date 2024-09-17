[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / resolveTypeReferenceDirective

# resolveTypeReferenceDirective()

```ts
function resolveTypeReferenceDirective(
   typeReferenceDirectiveName, 
   containingFile, 
   options, 
   host, 
   redirectedReference?, 
   cache?, 
   resolutionMode?): ResolvedTypeReferenceDirectiveWithFailedLookupLocations
```

## Parameters

• **typeReferenceDirectiveName**: `string`

• **containingFile**: `undefined` \| `string`

file that contains type reference directive, can be undefined if containing file is unknown.
This is possible in case if resolution is performed for directives specified via 'types' parameter. In this case initial path for secondary lookups
is assumed to be the same as root directory of the project.

• **options**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host**: [`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

• **redirectedReference?**: [`ResolvedProjectReference`](../interfaces/ResolvedProjectReference.md)

• **cache?**: [`TypeReferenceDirectiveResolutionCache`](../interfaces/TypeReferenceDirectiveResolutionCache.md)

• **resolutionMode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

## Returns

[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](../interfaces/ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9213
