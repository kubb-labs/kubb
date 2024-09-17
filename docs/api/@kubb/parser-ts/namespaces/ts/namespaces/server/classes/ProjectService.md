[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / ProjectService

# ProjectService

## Constructors

### new ProjectService()

```ts
new ProjectService(opts): ProjectService
```

#### Parameters

• **opts**: [`ProjectServiceOptions`](../interfaces/ProjectServiceOptions.md)

#### Returns

[`ProjectService`](ProjectService.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3248

## Properties

### allowLocalPluginLoads

```ts
readonly allowLocalPluginLoads: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3236

***

### cancellationToken

```ts
readonly cancellationToken: HostCancellationToken;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3227

***

### configuredProjects

```ts
readonly configuredProjects: Map<string, ConfiguredProject>;
```

projects specified by a tsconfig.json file

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3203

***

### currentDirectory

```ts
readonly currentDirectory: NormalizedPath;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3223

***

### externalProjects

```ts
readonly externalProjects: ExternalProject[];
```

external projects (configuration and list of root files is not controlled by tsserver)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3195

***

### globalPlugins

```ts
readonly globalPlugins: readonly string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3234

***

### host

```ts
readonly host: ServerHost;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3225

***

### inferredProjects

```ts
readonly inferredProjects: InferredProject[];
```

projects built from openFileRoots

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3199

***

### jsDocParsingMode

```ts
readonly jsDocParsingMode: undefined | JSDocParsingMode;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3247

***

### logger

```ts
readonly logger: Logger;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3226

***

### openFiles

```ts
readonly openFiles: Map<Path, undefined | NormalizedPath>;
```

Open files: with value being project root path, and key being Path of the file that is open

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3207

***

### pluginProbeLocations

```ts
readonly pluginProbeLocations: readonly string[];
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3235

***

### serverMode

```ts
readonly serverMode: LanguageServiceMode;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3238

***

### throttleWaitMilliseconds?

```ts
readonly optional throttleWaitMilliseconds: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3232

***

### toCanonicalFileName()

```ts
readonly toCanonicalFileName: (f) => string;
```

#### Parameters

• **f**: `string`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3224

***

### typesMapLocation

```ts
readonly typesMapLocation: undefined | string;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3237

***

### typingsInstaller

```ts
readonly typingsInstaller: ITypingsInstaller;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3230

***

### useInferredProjectPerProjectRoot

```ts
readonly useInferredProjectPerProjectRoot: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3229

***

### useSingleInferredProject

```ts
readonly useSingleInferredProject: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3228

## Methods

### applySafeList()

```ts
applySafeList(proj): NormalizedPath[]
```

#### Parameters

• **proj**: [`ExternalProject`](../namespaces/protocol/interfaces/ExternalProject.md)

#### Returns

[`NormalizedPath`](../type-aliases/NormalizedPath.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3358

***

### closeClientFile()

```ts
closeClientFile(uncheckedFileName): void
```

Close file whose contents is managed by the client

#### Parameters

• **uncheckedFileName**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3351

***

### closeExternalProject()

```ts
closeExternalProject(uncheckedFileName): void
```

#### Parameters

• **uncheckedFileName**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3353

***

### closeLog()

```ts
closeLog(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3320

***

### configurePlugin()

```ts
configurePlugin(args): void
```

#### Parameters

• **args**: [`ConfigurePluginRequestArguments`](../namespaces/protocol/interfaces/ConfigurePluginRequestArguments.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3365

***

### findProject()

```ts
findProject(projectName): undefined | Project
```

#### Parameters

• **projectName**: `string`

#### Returns

`undefined` \| [`Project`](Project.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3255

***

### getDefaultProjectForFile()

```ts
getDefaultProjectForFile(fileName, ensureProject): undefined | Project
```

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

• **ensureProject**: `boolean`

#### Returns

`undefined` \| [`Project`](Project.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3256

***

### getFormatCodeOptions()

```ts
getFormatCodeOptions(file): FormatCodeSettings
```

#### Parameters

• **file**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

[`FormatCodeSettings`](../../../interfaces/FormatCodeSettings.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3261

***

### getHostFormatCodeOptions()

```ts
getHostFormatCodeOptions(): FormatCodeSettings
```

#### Returns

[`FormatCodeSettings`](../../../interfaces/FormatCodeSettings.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3263

***

### getHostPreferences()

```ts
getHostPreferences(): UserPreferences
```

#### Returns

[`UserPreferences`](../namespaces/protocol/interfaces/UserPreferences.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3264

***

### getOrCreateScriptInfoForNormalizedPath()

```ts
getOrCreateScriptInfoForNormalizedPath(
   fileName, 
   openedByClient, 
   fileContent?, 
   scriptKind?, 
   hasMixedContent?, 
   hostToQueryFileExistsOn?): undefined | ScriptInfo
```

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

• **openedByClient**: `boolean`

• **fileContent?**: `string`

• **scriptKind?**: [`ScriptKind`](../../../enumerations/ScriptKind.md)

• **hasMixedContent?**: `boolean`

• **hostToQueryFileExistsOn?**

• **hostToQueryFileExistsOn.fileExists?**

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3307

***

### getPreferences()

```ts
getPreferences(file): UserPreferences
```

#### Parameters

• **file**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

[`UserPreferences`](../namespaces/protocol/interfaces/UserPreferences.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3262

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3298

***

### getScriptInfoEnsuringProjectsUptoDate()

```ts
getScriptInfoEnsuringProjectsUptoDate(uncheckedFileName): undefined | ScriptInfo
```

#### Parameters

• **uncheckedFileName**: `string`

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3259

***

### getScriptInfoForNormalizedPath()

```ts
getScriptInfoForNormalizedPath(fileName): undefined | ScriptInfo
```

This gets the script info for the normalized path. If the path is not rooted disk path then the open script info with project root context is preferred

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3314

***

### getScriptInfoForPath()

```ts
getScriptInfoForPath(fileName): undefined | ScriptInfo
```

#### Parameters

• **fileName**: [`Path`](../../../type-aliases/Path.md)

#### Returns

`undefined` \| [`ScriptInfo`](ScriptInfo.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3315

***

### hasDeferredExtension()

```ts
hasDeferredExtension(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3361

***

### openClientFile()

```ts
openClientFile(
   fileName, 
   fileContent?, 
   scriptKind?, 
   projectRootPath?): OpenConfiguredProjectResult
```

Open file whose contents is managed by the client

#### Parameters

• **fileName**: `string`

• **fileContent?**: `string`

is a known version of the file content that is more up to date than the one on disk

• **scriptKind?**: [`ScriptKind`](../../../enumerations/ScriptKind.md)

• **projectRootPath?**: `string`

#### Returns

[`OpenConfiguredProjectResult`](../interfaces/OpenConfiguredProjectResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3334

***

### openClientFileWithNormalizedPath()

```ts
openClientFileWithNormalizedPath(
   fileName, 
   fileContent?, 
   scriptKind?, 
   hasMixedContent?, 
   projectRootPath?): OpenConfiguredProjectResult
```

#### Parameters

• **fileName**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

• **fileContent?**: `string`

• **scriptKind?**: [`ScriptKind`](../../../enumerations/ScriptKind.md)

• **hasMixedContent?**: `boolean`

• **projectRootPath?**: [`NormalizedPath`](../type-aliases/NormalizedPath.md)

#### Returns

[`OpenConfiguredProjectResult`](../interfaces/OpenConfiguredProjectResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3344

***

### openExternalProject()

```ts
openExternalProject(proj): void
```

#### Parameters

• **proj**: [`ExternalProject`](../namespaces/protocol/interfaces/ExternalProject.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3360

***

### openExternalProjects()

```ts
openExternalProjects(projects): void
```

#### Parameters

• **projects**: [`ExternalProject`](../namespaces/protocol/interfaces/ExternalProject.md)[]

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3354

***

### reloadProjects()

```ts
reloadProjects(): void
```

This function rebuilds the project for every file opened by the client
This does not reload contents of open files from disk. But we could do that if needed

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3326

***

### resetSafeList()

```ts
resetSafeList(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3357

***

### setCompilerOptionsForInferredProjects()

```ts
setCompilerOptionsForInferredProjects(projectCompilerOptions, projectRootPath?): void
```

#### Parameters

• **projectCompilerOptions**: [`InferredProjectCompilerOptions`](../namespaces/protocol/type-aliases/InferredProjectCompilerOptions.md)

• **projectRootPath?**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3254

***

### setHostConfiguration()

```ts
setHostConfiguration(args): void
```

#### Parameters

• **args**: [`ConfigureRequestArguments`](../namespaces/protocol/interfaces/ConfigureRequestArguments.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3318

***

### toPath()

```ts
toPath(fileName): Path
```

#### Parameters

• **fileName**: `string`

#### Returns

[`Path`](../../../type-aliases/Path.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3249

***

### updateTypingsForProject()

```ts
updateTypingsForProject(response): void
```

#### Parameters

• **response**: [`SetTypings`](../interfaces/SetTypings.md) \| [`InvalidateCachedTypings`](../interfaces/InvalidateCachedTypings.md) \| [`PackageInstalledResponse`](../interfaces/PackageInstalledResponse.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3251
