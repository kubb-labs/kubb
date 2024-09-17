[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / InferredProject

# InferredProject

If a file is opened and no tsconfig (or jsconfig) is found,
the file and its imports/references are put into an InferredProject.

## Extends

- [`Project`](Project.md)

## Constructors

### new InferredProject()

```ts
new InferredProject(): InferredProject
```

#### Returns

[`InferredProject`](InferredProject.md)

#### Inherited from

[`Project`](Project.md).[`constructor`](Project.md#constructors)

## Properties

### compileOnSaveEnabled

```ts
compileOnSaveEnabled: boolean;
```

#### Inherited from

[`Project`](Project.md).[`compileOnSaveEnabled`](Project.md#compileonsaveenabled)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2813

***

### isInitialLoadPending()

```ts
protected isInitialLoadPending: () => boolean;
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`isInitialLoadPending`](Project.md#isinitialloadpending)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2831

***

### jsDocParsingMode

```ts
readonly jsDocParsingMode: undefined | JSDocParsingMode;
```

#### Inherited from

[`Project`](Project.md).[`jsDocParsingMode`](Project.md#jsdocparsingmode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2842

***

### languageService

```ts
protected languageService: LanguageService;
```

#### Inherited from

[`Project`](Project.md).[`languageService`](Project.md#languageservice)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2822

***

### languageServiceEnabled

```ts
languageServiceEnabled: boolean;
```

#### Inherited from

[`Project`](Project.md).[`languageServiceEnabled`](Project.md#languageserviceenabled)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2823

***

### projectErrors

```ts
protected projectErrors: undefined | Diagnostic[];
```

#### Inherited from

[`Project`](Project.md).[`projectErrors`](Project.md#projecterrors)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2830

***

### projectKind

```ts
readonly projectKind: ProjectKind;
```

#### Inherited from

[`Project`](Project.md).[`projectKind`](Project.md#projectkind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2809

***

### projectRootPath

```ts
readonly projectRootPath: undefined | string;
```

this is canonical project root path

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2945

***

### projectService

```ts
readonly projectService: ProjectService;
```

#### Inherited from

[`Project`](Project.md).[`projectService`](Project.md#projectservice)

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

#### Inherited from

[`Project`](Project.md).[`realpath`](Project.md#realpath)

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

#### Inherited from

[`Project`](Project.md).[`trace`](Project.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2824

***

### watchOptions

```ts
protected watchOptions: undefined | WatchOptions;
```

#### Inherited from

[`Project`](Project.md).[`watchOptions`](Project.md#watchoptions)

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

#### Inherited from

[`Project`](Project.md).[`addMissingFileRoot`](Project.md#addmissingfileroot)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2903

***

### addRoot()

```ts
addRoot(info): void
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`void`

#### Overrides

[`Project`](Project.md).[`addRoot`](Project.md#addroot)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2946

***

### close()

```ts
close(): void
```

#### Returns

`void`

#### Overrides

[`Project`](Project.md).[`close`](Project.md#close)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2949

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

#### Inherited from

[`Project`](Project.md).[`containsFile`](Project.md#containsfile)

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

#### Inherited from

[`Project`](Project.md).[`containsScriptInfo`](Project.md#containsscriptinfo)

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

#### Inherited from

[`Project`](Project.md).[`directoryExists`](Project.md#directoryexists)

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

#### Inherited from

[`Project`](Project.md).[`disableLanguageService`](Project.md#disablelanguageservice)

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

#### Inherited from

[`Project`](Project.md).[`emitFile`](Project.md#emitfile)

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

#### Inherited from

[`Project`](Project.md).[`enableGlobalPlugins`](Project.md#enableglobalplugins)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2929

***

### enableLanguageService()

```ts
enableLanguageService(): void
```

#### Returns

`void`

#### Inherited from

[`Project`](Project.md).[`enableLanguageService`](Project.md#enablelanguageservice)

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

#### Inherited from

[`Project`](Project.md).[`enablePlugin`](Project.md#enableplugin)

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

#### Inherited from

[`Project`](Project.md).[`error`](Project.md#error)

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

#### Inherited from

[`Project`](Project.md).[`fileExists`](Project.md#fileexists)

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

#### Inherited from

[`Project`](Project.md).[`filesToString`](Project.md#filestostring)

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

#### Inherited from

[`Project`](Project.md).[`getAllProjectErrors`](Project.md#getallprojecterrors)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2875

***

### getCancellationToken()

```ts
getCancellationToken(): HostCancellationToken
```

#### Returns

[`HostCancellationToken`](../../../interfaces/HostCancellationToken.md)

#### Inherited from

[`Project`](Project.md).[`getCancellationToken`](Project.md#getcancellationtoken)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2855

***

### getCompilationSettings()

```ts
getCompilationSettings(): CompilerOptions
```

#### Returns

[`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Inherited from

[`Project`](Project.md).[`getCompilationSettings`](Project.md#getcompilationsettings)

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

#### Inherited from

[`Project`](Project.md).[`getCompileOnSaveAffectedFileList`](Project.md#getcompileonsaveaffectedfilelist)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2878

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Inherited from

[`Project`](Project.md).[`getCompilerOptions`](Project.md#getcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2846

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`Project`](Project.md).[`getCurrentDirectory`](Project.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2856

***

### getDefaultLibFileName()

```ts
getDefaultLibFileName(): string
```

#### Returns

`string`

#### Inherited from

[`Project`](Project.md).[`getDefaultLibFileName`](Project.md#getdefaultlibfilename)

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

#### Inherited from

[`Project`](Project.md).[`getDirectories`](Project.md#getdirectories)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2864

***

### getExcludedFiles()

```ts
getExcludedFiles(): readonly NormalizedPath[]
```

#### Returns

readonly [`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Inherited from

[`Project`](Project.md).[`getExcludedFiles`](Project.md#getexcludedfiles)

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

#### Inherited from

[`Project`](Project.md).[`getExternalFiles`](Project.md#getexternalfiles)

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

#### Inherited from

[`Project`](Project.md).[`getFileNames`](Project.md#getfilenames)

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

#### Inherited from

[`Project`](Project.md).[`getGlobalProjectErrors`](Project.md#getglobalprojecterrors)

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

#### Inherited from

[`Project`](Project.md).[`getLanguageService`](Project.md#getlanguageservice)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2877

***

### getNewLine()

```ts
getNewLine(): string
```

#### Returns

`string`

#### Inherited from

[`Project`](Project.md).[`getNewLine`](Project.md#getnewline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2847

***

### getProjectName()

```ts
getProjectName(): string
```

#### Returns

`string`

#### Inherited from

[`Project`](Project.md).[`getProjectName`](Project.md#getprojectname)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2885

***

### getProjectReferences()

```ts
getProjectReferences(): undefined | readonly ProjectReference[]
```

#### Returns

`undefined` \| readonly [`ProjectReference`](../../../interfaces/ProjectReference.md)[]

#### Inherited from

[`Project`](Project.md).[`getProjectReferences`](Project.md#getprojectreferences)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2849

***

### getProjectVersion()

```ts
getProjectVersion(): string
```

#### Returns

`string`

#### Inherited from

[`Project`](Project.md).[`getProjectVersion`](Project.md#getprojectversion)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2848

***

### getRootFiles()

```ts
getRootFiles(): NormalizedPath[]
```

#### Returns

[`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Inherited from

[`Project`](Project.md).[`getRootFiles`](Project.md#getrootfiles)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2893

***

### getRootScriptInfos()

```ts
getRootScriptInfos(): ScriptInfo[]
```

#### Returns

[`ScriptInfo`](ScriptInfo.md)[]

#### Inherited from

[`Project`](Project.md).[`getRootScriptInfos`](Project.md#getrootscriptinfos)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2894

***

### getScriptFileNames()

```ts
getScriptFileNames(): string[]
```

#### Returns

`string`[]

#### Inherited from

[`Project`](Project.md).[`getScriptFileNames`](Project.md#getscriptfilenames)

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

#### Inherited from

[`Project`](Project.md).[`getScriptInfo`](Project.md#getscriptinfo)

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

#### Inherited from

[`Project`](Project.md).[`getScriptInfoForNormalizedPath`](Project.md#getscriptinfofornormalizedpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2921

***

### getScriptInfos()

```ts
getScriptInfos(): ScriptInfo[]
```

#### Returns

[`ScriptInfo`](ScriptInfo.md)[]

#### Inherited from

[`Project`](Project.md).[`getScriptInfos`](Project.md#getscriptinfos)

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

#### Inherited from

[`Project`](Project.md).[`getScriptKind`](Project.md#getscriptkind)

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

#### Inherited from

[`Project`](Project.md).[`getScriptSnapshot`](Project.md#getscriptsnapshot)

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

#### Inherited from

[`Project`](Project.md).[`getScriptVersion`](Project.md#getscriptversion)

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

#### Inherited from

[`Project`](Project.md).[`getSourceFile`](Project.md#getsourcefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2888

***

### getTypeAcquisition()

```ts
getTypeAcquisition(): TypeAcquisition
```

#### Returns

[`TypeAcquisition`](../../../interfaces/TypeAcquisition.md)

#### Overrides

[`Project`](Project.md).[`getTypeAcquisition`](Project.md#gettypeacquisition)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2950

***

### hasConfigFile()

```ts
hasConfigFile(configFilePath): boolean
```

#### Parameters

• **configFilePath**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`hasConfigFile`](Project.md#hasconfigfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2898

***

### hasRoots()

```ts
hasRoots(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`hasRoots`](Project.md#hasroots)

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

#### Inherited from

[`Project`](Project.md).[`installPackage`](Project.md#installpackage)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2844

***

### isClosed()

```ts
isClosed(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`isClosed`](Project.md#isclosed)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2891

***

### isJsOnlyProject()

```ts
isJsOnlyProject(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`isJsOnlyProject`](Project.md#isjsonlyproject)

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

#### Inherited from

[`Project`](Project.md).[`isKnownTypesPackageName`](Project.md#isknowntypespackagename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2843

***

### isNonTsProject()

```ts
isNonTsProject(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`isNonTsProject`](Project.md#isnontsproject)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2835

***

### isProjectWithSingleRoot()

```ts
isProjectWithSingleRoot(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2948

***

### isRoot()

```ts
isRoot(info): boolean
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`isRoot`](Project.md#isroot)

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

#### Inherited from

[`Project`](Project.md).[`log`](Project.md#log)

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

#### Inherited from

[`Project`](Project.md).[`readDirectory`](Project.md#readdirectory)

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

#### Inherited from

[`Project`](Project.md).[`readFile`](Project.md#readfile)

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

#### Inherited from

[`Project`](Project.md).[`refreshDiagnostics`](Project.md#refreshdiagnostics)

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

#### Inherited from

[`Project`](Project.md).[`registerFileUpdate`](Project.md#registerfileupdate)

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

#### Inherited from

[`Project`](Project.md).[`removeExistingTypings`](Project.md#removeexistingtypings)

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

#### Inherited from

[`Project`](Project.md).[`removeFile`](Project.md#removefile)

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

#### Inherited from

[`Project`](Project.md).[`removeLocalTypingsFromTypeAcquisition`](Project.md#removelocaltypingsfromtypeacquisition)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2886

***

### removeRoot()

```ts
removeRoot(info): void
```

#### Parameters

• **info**: [`ScriptInfo`](ScriptInfo.md)

#### Returns

`void`

#### Overrides

[`Project`](Project.md).[`removeRoot`](Project.md#removeroot)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2947

***

### setCompilerOptions()

```ts
setCompilerOptions(options?): void
```

#### Parameters

• **options?**: [`CompilerOptions`](../../../interfaces/CompilerOptions.md)

#### Returns

`void`

#### Overrides

[`Project`](Project.md).[`setCompilerOptions`](Project.md#setcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2943

***

### setProjectErrors()

```ts
setProjectErrors(projectErrors): void
```

#### Parameters

• **projectErrors**: `undefined` \| [`Diagnostic`](../../../interfaces/Diagnostic.md)[]

#### Returns

`void`

#### Inherited from

[`Project`](Project.md).[`setProjectErrors`](Project.md#setprojecterrors)

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

#### Inherited from

[`Project`](Project.md).[`setTypeAcquisition`](Project.md#settypeacquisition)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2926

***

### toggleJsInferredProject()

```ts
toggleJsInferredProject(isJsInferredProject): void
```

#### Parameters

• **isJsInferredProject**: `boolean`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2942

***

### updateGraph()

```ts
updateGraph(): boolean
```

Updates set of files that contribute to this project
@returns: true if set of files in the project stays the same and false - otherwise.

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`updateGraph`](Project.md#updategraph)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2910

***

### useCaseSensitiveFileNames()

```ts
useCaseSensitiveFileNames(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Project`](Project.md).[`useCaseSensitiveFileNames`](Project.md#usecasesensitivefilenames)

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

#### Inherited from

[`Project`](Project.md).[`writeFile`](Project.md#writefile)

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

#### Inherited from

[`Project`](Project.md).[`resolveModule`](Project.md#resolvemodule)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2837
