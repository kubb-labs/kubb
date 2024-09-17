[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getParsedCommandLineOfConfigFile

# getParsedCommandLineOfConfigFile()

```ts
function getParsedCommandLineOfConfigFile(
   configFileName, 
   optionsToExtend, 
   host, 
   extendedConfigCache?, 
   watchOptionsToExtend?, 
   extraFileExtensions?): ParsedCommandLine | undefined
```

Reads the config file, reports errors if any and exits if the config file cannot be found

## Parameters

• **configFileName**: `string`

• **optionsToExtend**: `undefined` \| [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host**: [`ParseConfigFileHost`](../interfaces/ParseConfigFileHost.md)

• **extendedConfigCache?**: `Map`\<`string`, [`ExtendedConfigCacheEntry`](../interfaces/ExtendedConfigCacheEntry.md)\>

• **watchOptionsToExtend?**: [`WatchOptions`](../interfaces/WatchOptions.md)

• **extraFileExtensions?**: readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

## Returns

[`ParsedCommandLine`](../interfaces/ParsedCommandLine.md) \| `undefined`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9126
