[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / Project

# `abstract` Project

Used by services to specify the minimum host area required to set up source files under any compilation settings

## Extended by

- [`InferredProject`](InferredProject.md)
- [`AutoImportProviderProject`](AutoImportProviderProject.md)
- [`ConfiguredProject`](ConfiguredProject.md)
- [`ExternalProject`](ExternalProject.md)

## Implements

- [`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md)
- [`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md)

## Constructors

### new Project()

```ts
new Project(): Project
```

#### Returns

[`Project`](Project.md)

## Properties

### compileOnSaveEnabled

```ts
compileOnSaveEnabled: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2813

***

### isInitialLoadPending()

```ts
protected isInitialLoadPending: () => boolean;
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2831

***

### jsDocParsingMode

```ts
readonly jsDocParsingMode: undefined | JSDocParsingMode;
```

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`jsDocParsingMode`](../../../interfaces/LanguageServiceHost.md#jsdocparsingmode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2842

***

### languageService

```ts
protected languageService: LanguageService;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2822

***

### languageServiceEnabled

```ts
languageServiceEnabled: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2823

***

### projectErrors

```ts
protected projectErrors: undefined | Diagnostic[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2830

***

### projectKind

```ts
readonly projectKind: ProjectKind;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2809

***

### projectService

```ts
readonly projectService: ProjectService;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2810

***

### realpath()?

```ts
readonly optional realpath: (path) => string;
```

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`realpath`](../../../interfaces/ModuleResolutionHost.md#realpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2825

***

### trace()?

```ts
readonly optional trace: (s) => void;
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`trace`](../../../interfaces/ModuleResolutionHost.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2824

***

### watchOptions

```ts
protected watchOptions: undefined | WatchOptions;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2814

## Methods

### addMissingFileRoot()

```ts
addMissingFileRoot(fileName): void
```

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2903

***

### addRoot()

```ts
addRoot(info, fileName?): void
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

• **fileName?**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2902

***

### close()

```ts
close(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2889

***

### containsFile()

```ts
containsFile(filename, requireOpen?): boolean
```

#### Parameters

• **filename**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

• **requireOpen?**: `boolean`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2900

***

### containsScriptInfo()

```ts
containsScriptInfo(info): boolean
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2899

***

### directoryExists()

```ts
directoryExists(path): boolean
```

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`directoryExists`](../../../interfaces/ModuleResolutionHost.md#directoryexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2863

***

### disableLanguageService()

```ts
disableLanguageService(lastFileExceededProgramSize?): void
```

#### Parameters

• **lastFileExceededProgramSize?**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2884

***

### emitFile()

```ts
emitFile(scriptInfo, writeFile): EmitResult
```

Returns true if emit was conducted

#### Parameters

• **scriptInfo**: [`ScriptInfo`](ScriptInfo.md)

• **writeFile**

#### Returns

[`EmitResult`](../../../interfaces/EmitResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2882

***

### enableGlobalPlugins()

```ts
protected enableGlobalPlugins(options): void
```

#### Parameters

• **options**: [`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2929

***

### enableLanguageService()

```ts
enableLanguageService(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2883

***

### enablePlugin()

```ts
protected enablePlugin(pluginConfigEntry, searchPaths): void
```

#### Parameters

• **pluginConfigEntry**: [`PluginImport`](../../../interfaces/PluginImport.md)

• **searchPaths**: `string`[]

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2930

***

### error()

```ts
error(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`error`](../../../interfaces/LanguageServiceHost.md#error)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2866

***

### fileExists()

```ts
fileExists(file): boolean
```

#### Parameters

• **file**: `string`

#### Returns

`boolean`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`fileExists`](../../../interfaces/ModuleResolutionHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2862

***

### filesToString()

```ts
filesToString(writeProjectFileNames): string
```

#### Parameters

• **writeProjectFileNames**: `boolean`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2923

***

### getAllProjectErrors()

```ts
getAllProjectErrors(): readonly Diagnostic[]
```

Get all the project errors

#### Returns

readonly [`Diagnostic`](../../../interfaces/Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2875

***

### getCancellationToken()

```ts
getCancellationToken(): HostCancellationToken
```

#### Returns

[`HostCancellationToken`](../../../interfaces/HostCancellationToken.md)

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getCancellationToken`](../../../interfaces/LanguageServiceHost.md#getcancellationtoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2855

***

### getCompilationSettings()

```ts
getCompilationSettings(): CompilerOptions
```

#### Returns

[`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getCompilationSettings`](../../../interfaces/LanguageServiceHost.md#getcompilationsettings)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2845

***

### getCompileOnSaveAffectedFileList()

```ts
getCompileOnSaveAffectedFileList(scriptInfo): string[]
```

#### Parameters

• **scriptInfo**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2878

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2846

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`getCurrentDirectory`](../../../interfaces/ModuleResolutionHost.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2856

***

### getDefaultLibFileName()

```ts
getDefaultLibFileName(): string
```

#### Returns

`string`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getDefaultLibFileName`](../../../interfaces/LanguageServiceHost.md#getdefaultlibfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2857

***

### getDirectories()

```ts
getDirectories(path): string[]
```

#### Parameters

• **path**: `string`

#### Returns

`string`[]

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`getDirectories`](../../../interfaces/ModuleResolutionHost.md#getdirectories)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2864

***

### getExcludedFiles()

```ts
getExcludedFiles(): readonly NormalizedPath[]
```

#### Returns

readonly [`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2896

***

### getExternalFiles()

```ts
getExternalFiles(updateLevel?): SortedReadonlyArray<string>
```

#### Parameters

• **updateLevel?**: [`ProgramUpdateLevel`](../../../enumerations/ProgramUpdateLevel.md)

#### Returns

[`SortedReadonlyArray`](../../../interfaces/SortedReadonlyArray.md)\<`string`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2887

***

### getFileNames()

```ts
getFileNames(excludeFilesFromExternalLibraries?, excludeConfigFiles?): NormalizedPath[]
```

#### Parameters

• **excludeFilesFromExternalLibraries?**: `boolean`

• **excludeConfigFiles?**: `boolean`

#### Returns

[`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2897

***

### getGlobalProjectErrors()

```ts
getGlobalProjectErrors(): readonly Diagnostic[]
```

Get the errors that dont have any file name associated

#### Returns

readonly [`Diagnostic`](../../../interfaces/Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2871

***

### getLanguageService()

```ts
getLanguageService(ensureSynchronized?): LanguageService
```

#### Parameters

• **ensureSynchronized?**: `boolean`

#### Returns

[`LanguageService`](../../../interfaces/LanguageService.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2877

***

### getNewLine()

```ts
getNewLine(): string
```

#### Returns

`string`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getNewLine`](../../../interfaces/LanguageServiceHost.md#getnewline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2847

***

### getProjectName()

```ts
getProjectName(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2885

***

### getProjectReferences()

```ts
getProjectReferences(): undefined | readonly ProjectReference[]
```

#### Returns

`undefined` \| readonly [`ProjectReference`](../../../interfaces/ProjectReference.md)[]

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getProjectReferences`](../../../interfaces/LanguageServiceHost.md#getprojectreferences)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2849

***

### getProjectVersion()

```ts
getProjectVersion(): string
```

#### Returns

`string`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getProjectVersion`](../../../interfaces/LanguageServiceHost.md#getprojectversion)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2848

***

### getRootFiles()

```ts
getRootFiles(): NormalizedPath[]
```

#### Returns

[`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2893

***

### getRootScriptInfos()

```ts
getRootScriptInfos(): ScriptInfo[]
```

#### Returns

[`ScriptInfo`](ScriptInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2894

***

### getScriptFileNames()

```ts
getScriptFileNames(): string[]
```

#### Returns

`string`[]

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getScriptFileNames`](../../../interfaces/LanguageServiceHost.md#getscriptfilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2850

***

### getScriptInfo()

```ts
getScriptInfo(uncheckedFileName): undefined | ScriptInfo
```

#### Parameters

• **uncheckedFileName**: `string`

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2922

***

### getScriptInfoForNormalizedPath()

```ts
getScriptInfoForNormalizedPath(fileName): undefined | ScriptInfo
```

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2921

***

### getScriptInfos()

```ts
getScriptInfos(): ScriptInfo[]
```

#### Returns

[`ScriptInfo`](ScriptInfo.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2895

***

### getScriptKind()

```ts
getScriptKind(fileName): ScriptKind
```

#### Parameters

• **fileName**: `string`

#### Returns

[`ScriptKind`](../../../enumerations/ScriptKind.md)

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getScriptKind`](../../../interfaces/LanguageServiceHost.md#getscriptkind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2852

***

### getScriptSnapshot()

```ts
getScriptSnapshot(filename): undefined | IScriptSnapshot
```

#### Parameters

• **filename**: `string`

#### Returns

`undefined` \| [`IScriptSnapshot`](../../../interfaces/IScriptSnapshot.md)

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getScriptSnapshot`](../../../interfaces/LanguageServiceHost.md#getscriptsnapshot)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2854

***

### getScriptVersion()

```ts
getScriptVersion(filename): string
```

#### Parameters

• **filename**: `string`

#### Returns

`string`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`getScriptVersion`](../../../interfaces/LanguageServiceHost.md#getscriptversion)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2853

***

### getSourceFile()

```ts
getSourceFile(path): undefined | SourceFile
```

#### Parameters

• **path**: [`Path`](../../../type-aliases/Path.md)

#### Returns

`undefined` \| [`SourceFile`](../../../interfaces/SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2888

***

### getTypeAcquisition()

```ts
getTypeAcquisition(): TypeAcquisition
```

#### Returns

[`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2927

***

### hasConfigFile()

```ts
hasConfigFile(configFilePath): boolean
```

#### Parameters

• **configFilePath**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2898

***

### hasRoots()

```ts
hasRoots(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2892

***

### installPackage()

```ts
installPackage(options): Promise<ApplyCodeActionCommandResult>
```

#### Parameters

• **options**: [`InstallPackageOptions`](../../../interfaces/InstallPackageOptions.md)

#### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](../../../interfaces/ApplyCodeActionCommandResult.md)\>

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`installPackage`](../../../interfaces/LanguageServiceHost.md#installpackage)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2844

***

### isClosed()

```ts
isClosed(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2891

***

### isJsOnlyProject()

```ts
isJsOnlyProject(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2836

***

### isKnownTypesPackageName()

```ts
isKnownTypesPackageName(name): boolean
```

#### Parameters

• **name**: `string`

#### Returns

`boolean`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`isKnownTypesPackageName`](../../../interfaces/LanguageServiceHost.md#isknowntypespackagename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2843

***

### isNonTsProject()

```ts
isNonTsProject(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2835

***

### isRoot()

```ts
isRoot(info): boolean
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2901

***

### log()

```ts
log(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`log`](../../../interfaces/LanguageServiceHost.md#log)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2865

***

### readDirectory()

```ts
readDirectory(
   path, 
   extensions?, 
   exclude?, 
   include?, 
   depth?): string[]
```

#### Parameters

• **path**: `string`

• **extensions?**: readonly `string`[]

• **exclude?**: readonly `string`[]

• **include?**: readonly `string`[]

• **depth?**: `number`

#### Returns

`string`[]

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`readDirectory`](../../../interfaces/LanguageServiceHost.md#readdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2859

***

### readFile()

```ts
readFile(fileName): undefined | string
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| `string`

#### Implementation of

[`ModuleResolutionHost`](../../../interfaces/ModuleResolutionHost.md).[`readFile`](../../../interfaces/ModuleResolutionHost.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2860

***

### refreshDiagnostics()

```ts
refreshDiagnostics(): void
```

Starts a new check for diagnostics. Call this if some file has updated that would cause diagnostics to be changed.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2932

***

### registerFileUpdate()

```ts
registerFileUpdate(fileName): void
```

#### Parameters

• **fileName**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2905

***

### removeExistingTypings()

```ts
protected removeExistingTypings(include): string[]
```

#### Parameters

• **include**: `string`[]

#### Returns

`string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2913

***

### removeFile()

```ts
removeFile(
   info, 
   fileExists, 
   detachFromProject): void
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

• **fileExists**: `boolean`

• **detachFromProject**: `boolean`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2904

***

### removeLocalTypingsFromTypeAcquisition()

```ts
protected removeLocalTypingsFromTypeAcquisition(newTypeAcquisition): TypeAcquisition
```

#### Parameters

• **newTypeAcquisition**: [`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

#### Returns

[`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2886

***

### removeRoot()

```ts
protected removeRoot(info): void
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2928

***

### setCompilerOptions()

```ts
setCompilerOptions(compilerOptions): void
```

#### Parameters

• **compilerOptions**: [`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2925

***

### setProjectErrors()

```ts
setProjectErrors(projectErrors): void
```

#### Parameters

• **projectErrors**: `undefined` \| [`Diagnostic`](../../../interfaces/Diagnostic.md)[]

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2876

***

### setTypeAcquisition()

```ts
setTypeAcquisition(newTypeAcquisition): void
```

#### Parameters

• **newTypeAcquisition**: `undefined` \| [`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2926

***

### updateGraph()

```ts
updateGraph(): boolean
```

Updates set of files that contribute to this project
@returns: true if set of files in the project stays the same and false - otherwise.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2910

***

### useCaseSensitiveFileNames()

```ts
useCaseSensitiveFileNames(): boolean
```

#### Returns

`boolean`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`useCaseSensitiveFileNames`](../../../interfaces/LanguageServiceHost.md#usecasesensitivefilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2858

***

### writeFile()

```ts
writeFile(fileName, content): void
```

#### Parameters

• **fileName**: `string`

• **content**: `string`

#### Returns

`void`

#### Implementation of

[`LanguageServiceHost`](../../../interfaces/LanguageServiceHost.md).[`writeFile`](../../../interfaces/LanguageServiceHost.md#writefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2861

***

### resolveModule()

```ts
static resolveModule(
   moduleName, 
   initialDir, 
   host, 
   log): undefined | object
```

#### Parameters

• **moduleName**: `string`

• **initialDir**: `string`

• **host**: [`ServerHost`](../interfaces/ServerHost.md)

• **log**

#### Returns

`undefined` \| `object`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2837
