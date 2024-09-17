[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / LanguageServiceHost

# LanguageServiceHost

Used by services to specify the minimum host area required to set up source files under any compilation settings

## Extends

- [`GetEffectiveTypeRootsHost`](GetEffectiveTypeRootsHost.md).[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)

## Properties

### jsDocParsingMode?

```ts
optional jsDocParsingMode: JSDocParsingMode;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9996

## Methods

### directoryExists()?

```ts
optional directoryExists(directoryName): boolean
```

#### Parameters

• **directoryName**: `string`

#### Returns

`boolean`

#### Inherited from

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`directoryExists`](MinimalResolutionCacheHost.md#directoryexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7170

***

### error()?

```ts
optional error(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9973

***

### fileExists()

```ts
fileExists(path): boolean
```

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`fileExists`](MinimalResolutionCacheHost.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9978

***

### getCancellationToken()?

```ts
optional getCancellationToken(): HostCancellationToken
```

#### Returns

[`HostCancellationToken`](HostCancellationToken.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9968

***

### getCompilationSettings()

```ts
getCompilationSettings(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCompilationSettings`](MinimalResolutionCacheHost.md#getcompilationsettings)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9959

***

### getCompilerHost()?

```ts
optional getCompilerHost(): undefined | CompilerHost
```

#### Returns

`undefined` \| [`CompilerHost`](CompilerHost.md)

#### Inherited from

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCompilerHost`](MinimalResolutionCacheHost.md#getcompilerhost)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7185

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getCurrentDirectory`](MinimalResolutionCacheHost.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9969

***

### getCustomTransformers()?

```ts
optional getCustomTransformers(): undefined | CustomTransformers
```

Gets a set of custom transformers to use during emit.

#### Returns

`undefined` \| [`CustomTransformers`](CustomTransformers.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9991

***

### getDefaultLibFileName()

```ts
getDefaultLibFileName(options): string
```

#### Parameters

• **options**: [`CompilerOptions`](CompilerOptions.md)

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9970

***

### getDirectories()?

```ts
optional getDirectories(directoryName): string[]
```

#### Parameters

• **directoryName**: `string`

#### Returns

`string`[]

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`getDirectories`](MinimalResolutionCacheHost.md#getdirectories)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9987

***

### getLocalizedDiagnosticMessages()?

```ts
optional getLocalizedDiagnosticMessages(): any
```

#### Returns

`any`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9967

***

### getNewLine()?

```ts
optional getNewLine(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9960

***

### getParsedCommandLine()?

```ts
optional getParsedCommandLine(fileName): undefined | ParsedCommandLine
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9995

***

### getProjectReferences()?

```ts
optional getProjectReferences(): undefined | readonly ProjectReference[]
```

#### Returns

`undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9966

***

### getProjectVersion()?

```ts
optional getProjectVersion(): string
```

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9961

***

### getResolvedModuleWithFailedLookupLocationsFromCache()?

```ts
optional getResolvedModuleWithFailedLookupLocationsFromCache(
   modulename, 
   containingFile, 
   resolutionMode?): undefined | ResolvedModuleWithFailedLookupLocations
```

#### Parameters

• **modulename**: `string`

• **containingFile**: `string`

• **resolutionMode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

`undefined` \| [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9982

***

### getScriptFileNames()

```ts
getScriptFileNames(): string[]
```

#### Returns

`string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9962

***

### getScriptKind()?

```ts
optional getScriptKind(fileName): ScriptKind
```

#### Parameters

• **fileName**: `string`

#### Returns

[`ScriptKind`](../enumerations/ScriptKind.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9963

***

### getScriptSnapshot()

```ts
getScriptSnapshot(fileName): undefined | IScriptSnapshot
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`IScriptSnapshot`](IScriptSnapshot.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9965

***

### getScriptVersion()

```ts
getScriptVersion(fileName): string
```

#### Parameters

• **fileName**: `string`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9964

***

### getTypeRootsVersion()?

```ts
optional getTypeRootsVersion(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9979

***

### installPackage()?

```ts
optional installPackage(options): Promise<ApplyCodeActionCommandResult>
```

#### Parameters

• **options**: [`InstallPackageOptions`](InstallPackageOptions.md)

#### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9993

***

### isKnownTypesPackageName()?

```ts
optional isKnownTypesPackageName(name): boolean
```

#### Parameters

• **name**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9992

***

### log()?

```ts
optional log(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9971

***

### readDirectory()?

```ts
optional readDirectory(
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

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9975

***

### readFile()

```ts
readFile(path, encoding?): undefined | string
```

#### Parameters

• **path**: `string`

• **encoding?**: `string`

#### Returns

`undefined` \| `string`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`readFile`](MinimalResolutionCacheHost.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9977

***

### realpath()?

```ts
optional realpath(path): string
```

Resolve a symbolic link.

#### Parameters

• **path**: `string`

#### Returns

`string`

#### See

https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`realpath`](MinimalResolutionCacheHost.md#realpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9976

***

### resolveModuleNameLiterals()?

```ts
optional resolveModuleNameLiterals(
   moduleLiterals, 
   containingFile, 
   redirectedReference, 
   options, 
   containingSourceFile, 
   reusedNames): readonly ResolvedModuleWithFailedLookupLocations[]
```

#### Parameters

• **moduleLiterals**: readonly [`StringLiteralLike`](../type-aliases/StringLiteralLike.md)[]

• **containingFile**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **containingSourceFile**: [`SourceFile`](SourceFile.md)

• **reusedNames**: `undefined` \| readonly [`StringLiteralLike`](../type-aliases/StringLiteralLike.md)[]

#### Returns

readonly [`ResolvedModuleWithFailedLookupLocations`](ResolvedModuleWithFailedLookupLocations.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9985

***

### ~~resolveModuleNames()?~~

```ts
optional resolveModuleNames(
   moduleNames, 
   containingFile, 
   reusedNames, 
   redirectedReference, 
   options, 
   containingSourceFile?): (undefined | ResolvedModule)[]
```

#### Parameters

• **moduleNames**: `string`[]

• **containingFile**: `string`

• **reusedNames**: `undefined` \| `string`[]

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **containingSourceFile?**: [`SourceFile`](SourceFile.md)

#### Returns

(`undefined` \| [`ResolvedModule`](ResolvedModule.md))[]

#### Deprecated

supply resolveModuleNameLiterals instead for resolution that can handle newer resolution modes like nodenext

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9981

***

### resolveTypeReferenceDirectiveReferences()?

```ts
optional resolveTypeReferenceDirectiveReferences<T>(
   typeDirectiveReferences, 
   containingFile, 
   redirectedReference, 
   options, 
   containingSourceFile, 
   reusedNames): readonly ResolvedTypeReferenceDirectiveWithFailedLookupLocations[]
```

#### Type Parameters

• **T** *extends* `string` \| [`FileReference`](FileReference.md)

#### Parameters

• **typeDirectiveReferences**: readonly `T`[]

• **containingFile**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **containingSourceFile**: `undefined` \| [`SourceFile`](SourceFile.md)

• **reusedNames**: `undefined` \| readonly `T`[]

#### Returns

readonly [`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9986

***

### ~~resolveTypeReferenceDirectives()?~~

```ts
optional resolveTypeReferenceDirectives(
   typeDirectiveNames, 
   containingFile, 
   redirectedReference, 
   options, 
   containingFileMode?): (undefined | ResolvedTypeReferenceDirective)[]
```

#### Parameters

• **typeDirectiveNames**: `string`[] \| [`FileReference`](FileReference.md)[]

• **containingFile**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **containingFileMode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

(`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

#### Deprecated

supply resolveTypeReferenceDirectiveReferences instead for resolution that can handle newer resolution modes like nodenext

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9984

***

### trace()?

```ts
optional trace(s): void
```

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Overrides

[`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md).[`trace`](MinimalResolutionCacheHost.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9972

***

### useCaseSensitiveFileNames()?

```ts
optional useCaseSensitiveFileNames(): boolean
```

#### Returns

`boolean`

#### Overrides

`MinimalResolutionCacheHost.useCaseSensitiveFileNames`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9974

***

### writeFile()?

```ts
optional writeFile(fileName, content): void
```

#### Parameters

• **fileName**: `string`

• **content**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9994
