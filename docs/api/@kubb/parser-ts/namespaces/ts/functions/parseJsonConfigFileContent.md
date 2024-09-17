[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / parseJsonConfigFileContent

# parseJsonConfigFileContent()

```ts
function parseJsonConfigFileContent(
   json, 
   host, 
   basePath, 
   existingOptions?, 
   configFileName?, 
   resolutionStack?, 
   extraFileExtensions?, 
   extendedConfigCache?, 
   existingWatchOptions?): ParsedCommandLine
```

Parse the contents of a config file (tsconfig.json).

## Parameters

• **json**: `any`

The contents of the config file to parse

• **host**: [`ParseConfigHost`](../interfaces/ParseConfigHost.md)

Instance of ParseConfigHost used to enumerate files in folder.

• **basePath**: `string`

A root directory to resolve relative path entries in the config
   file to. e.g. outDir

• **existingOptions?**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **configFileName?**: `string`

• **resolutionStack?**: [`Path`](../type-aliases/Path.md)[]

• **extraFileExtensions?**: readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

• **extendedConfigCache?**: `Map`\<`string`, [`ExtendedConfigCacheEntry`](../interfaces/ExtendedConfigCacheEntry.md)\>

• **existingWatchOptions?**: [`WatchOptions`](../interfaces/WatchOptions.md)

## Returns

[`ParsedCommandLine`](../interfaces/ParsedCommandLine.md)

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9160
