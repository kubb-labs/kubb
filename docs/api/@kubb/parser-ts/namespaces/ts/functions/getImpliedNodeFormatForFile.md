[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getImpliedNodeFormatForFile

# getImpliedNodeFormatForFile()

```ts
function getImpliedNodeFormatForFile(
   fileName, 
   packageJsonInfoCache?, 
   host?, 
   options?): ResolutionMode
```

A function for determining if a given file is esm or cjs format, assuming modern node module resolution rules, as configured by the
`options` parameter.

## Parameters

• **fileName**: `string`

The file name to check the format of (it need not exist on disk)

• **packageJsonInfoCache?**: [`PackageJsonInfoCache`](../interfaces/PackageJsonInfoCache.md)

A cache for package file lookups - it's best to have a cache when this function is called often

• **host?**: [`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

The ModuleResolutionHost which can perform the filesystem lookups for package json data

• **options?**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

The compiler options to perform the analysis under - relevant options are `moduleResolution` and `traceResolution`

## Returns

[`ResolutionMode`](../type-aliases/ResolutionMode.md)

`undefined` if the path has no relevant implied format, `ModuleKind.ESNext` for esm format, and `ModuleKind.CommonJS` for cjs format

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9489
