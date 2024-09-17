[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createWatchCompilerHost

# createWatchCompilerHost()

## createWatchCompilerHost(configFileName, optionsToExtend, system, createProgram, reportDiagnostic, reportWatchStatus, watchOptionsToExtend, extraFileExtensions)

```ts
function createWatchCompilerHost<T>(
   configFileName, 
   optionsToExtend, 
   system, 
   createProgram?, 
   reportDiagnostic?, 
   reportWatchStatus?, 
   watchOptionsToExtend?, 
extraFileExtensions?): WatchCompilerHostOfConfigFile<T>
```

Create the watch compiler host for either configFile or fileNames and its options

### Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

• **configFileName**: `string`

• **optionsToExtend**: `undefined` \| [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **system**: [`System`](../interfaces/System.md)

• **createProgram?**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

• **reportDiagnostic?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportWatchStatus?**: [`WatchStatusReporter`](../type-aliases/WatchStatusReporter.md)

• **watchOptionsToExtend?**: [`WatchOptions`](../interfaces/WatchOptions.md)

• **extraFileExtensions?**: readonly [`FileExtensionInfo`](../interfaces/FileExtensionInfo.md)[]

### Returns

[`WatchCompilerHostOfConfigFile`](../interfaces/WatchCompilerHostOfConfigFile.md)\<`T`\>

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9665

## createWatchCompilerHost(rootFiles, options, system, createProgram, reportDiagnostic, reportWatchStatus, projectReferences, watchOptions)

```ts
function createWatchCompilerHost<T>(
   rootFiles, 
   options, 
   system, 
   createProgram?, 
   reportDiagnostic?, 
   reportWatchStatus?, 
   projectReferences?, 
watchOptions?): WatchCompilerHostOfFilesAndCompilerOptions<T>
```

### Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

### Parameters

• **rootFiles**: `string`[]

• **options**: [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **system**: [`System`](../interfaces/System.md)

• **createProgram?**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

• **reportDiagnostic?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportWatchStatus?**: [`WatchStatusReporter`](../type-aliases/WatchStatusReporter.md)

• **projectReferences?**: readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

• **watchOptions?**: [`WatchOptions`](../interfaces/WatchOptions.md)

### Returns

[`WatchCompilerHostOfFilesAndCompilerOptions`](../interfaces/WatchCompilerHostOfFilesAndCompilerOptions.md)\<`T`\>

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9666
