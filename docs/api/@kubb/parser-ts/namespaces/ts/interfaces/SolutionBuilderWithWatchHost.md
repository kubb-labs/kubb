[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / SolutionBuilderWithWatchHost

# SolutionBuilderWithWatchHost\<T\>

Host that has watch functionality used in --watch mode

## Extends

- [`SolutionBuilderHostBase`](SolutionBuilderHostBase.md)\<`T`\>.[`WatchHost`](WatchHost.md)

## Type Parameters

• **T** *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### createProgram

```ts
createProgram: CreateProgram<T>;
```

Used to create the program when need for program creation or recreation detected

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createProgram`](SolutionBuilderHostBase.md#createprogram)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9709

***

### getCustomTransformers()?

```ts
optional getCustomTransformers: (project) => undefined | CustomTransformers;
```

#### Parameters

• **project**: `string`

#### Returns

`undefined` \| [`CustomTransformers`](CustomTransformers.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getCustomTransformers`](SolutionBuilderHostBase.md#getcustomtransformers)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9849

***

### jsDocParsingMode?

```ts
optional jsDocParsingMode: JSDocParsingMode;
```

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`jsDocParsingMode`](SolutionBuilderHostBase.md#jsdocparsingmode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9758

***

### preferNonRecursiveWatch?

```ts
optional preferNonRecursiveWatch: boolean;
```

#### Inherited from

[`WatchHost`](WatchHost.md).[`preferNonRecursiveWatch`](WatchHost.md#prefernonrecursivewatch)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9703

***

### reportDiagnostic

```ts
reportDiagnostic: DiagnosticReporter;
```

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`reportDiagnostic`](SolutionBuilderHostBase.md#reportdiagnostic)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9854

***

### reportSolutionBuilderStatus

```ts
reportSolutionBuilderStatus: DiagnosticReporter;
```

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`reportSolutionBuilderStatus`](SolutionBuilderHostBase.md#reportsolutionbuilderstatus)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9855

## Methods

### afterProgramEmitAndDiagnostics()?

```ts
optional afterProgramEmitAndDiagnostics(program): void
```

#### Parameters

• **program**: `T`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`afterProgramEmitAndDiagnostics`](SolutionBuilderHostBase.md#afterprogramemitanddiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9856

***

### clearTimeout()?

```ts
optional clearTimeout(timeoutId): void
```

If provided, will be used to reset existing delayed compilation

#### Parameters

• **timeoutId**: `any`

#### Returns

`void`

#### Inherited from

[`WatchHost`](WatchHost.md).[`clearTimeout`](WatchHost.md#cleartimeout)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9702

***

### createDirectory()?

```ts
optional createDirectory(path): void
```

#### Parameters

• **path**: `string`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createDirectory`](SolutionBuilderHostBase.md#createdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9843

***

### createHash()?

```ts
optional createHash(data): string
```

#### Parameters

• **data**: `string`

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`createHash`](SolutionBuilderHostBase.md#createhash)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9715

***

### deleteFile()

```ts
deleteFile(fileName): void
```

#### Parameters

• **fileName**: `string`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`deleteFile`](SolutionBuilderHostBase.md#deletefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9852

***

### directoryExists()?

```ts
optional directoryExists(path): boolean
```

If provided, used for module resolution as well as to handle directory structure

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`directoryExists`](SolutionBuilderHostBase.md#directoryexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9727

***

### fileExists()

```ts
fileExists(path): boolean
```

Use to check file presence for source files and
if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well

#### Parameters

• **path**: `string`

#### Returns

`boolean`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`fileExists`](SolutionBuilderHostBase.md#fileexists)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9720

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getCurrentDirectory`](SolutionBuilderHostBase.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9712

***

### getDefaultLibFileName()

```ts
getDefaultLibFileName(options): string
```

#### Parameters

• **options**: [`CompilerOptions`](CompilerOptions.md)

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDefaultLibFileName`](SolutionBuilderHostBase.md#getdefaultlibfilename)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9713

***

### getDefaultLibLocation()?

```ts
optional getDefaultLibLocation(): string
```

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDefaultLibLocation`](SolutionBuilderHostBase.md#getdefaultliblocation)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9714

***

### getDirectories()?

```ts
optional getDirectories(path): string[]
```

If provided, used in resolutions as well as handling directory structure

#### Parameters

• **path**: `string`

#### Returns

`string`[]

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getDirectories`](SolutionBuilderHostBase.md#getdirectories)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9729

***

### getEnvironmentVariable()?

```ts
optional getEnvironmentVariable(name): undefined | string
```

If provided is used to get the environment variable

#### Parameters

• **name**: `string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getEnvironmentVariable`](SolutionBuilderHostBase.md#getenvironmentvariable)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9737

***

### getModifiedTime()

```ts
getModifiedTime(fileName): undefined | Date
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| `Date`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getModifiedTime`](SolutionBuilderHostBase.md#getmodifiedtime)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9850

***

### getModuleResolutionCache()?

```ts
optional getModuleResolutionCache(): undefined | ModuleResolutionCache
```

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getModuleResolutionCache`](SolutionBuilderHostBase.md#getmoduleresolutioncache)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9757

***

### getNewLine()

```ts
getNewLine(): string
```

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getNewLine`](SolutionBuilderHostBase.md#getnewline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9711

***

### getParsedCommandLine()?

```ts
optional getParsedCommandLine(fileName): undefined | ParsedCommandLine
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`getParsedCommandLine`](SolutionBuilderHostBase.md#getparsedcommandline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9853

***

### hasInvalidatedResolutions()?

```ts
optional hasInvalidatedResolutions(filePath): boolean
```

If provided along with custom resolveModuleNames or resolveTypeReferenceDirectives, used to determine if unchanged file path needs to re-resolve modules/type reference directives

#### Parameters

• **filePath**: [`Path`](../type-aliases/Path.md)

#### Returns

`boolean`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`hasInvalidatedResolutions`](SolutionBuilderHostBase.md#hasinvalidatedresolutions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9753

***

### onWatchStatusChange()?

```ts
optional onWatchStatusChange(
   diagnostic, 
   newLine, 
   options, 
   errorCount?): void
```

If provided, called with Diagnostic message that informs about change in watch status

#### Parameters

• **diagnostic**: [`Diagnostic`](Diagnostic.md)

• **newLine**: `string`

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **errorCount?**: `number`

#### Returns

`void`

#### Inherited from

[`WatchHost`](WatchHost.md).[`onWatchStatusChange`](WatchHost.md#onwatchstatuschange)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9694

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

If provided, used to cache and handle directory structure modifications

#### Parameters

• **path**: `string`

• **extensions?**: readonly `string`[]

• **exclude?**: readonly `string`[]

• **include?**: readonly `string`[]

• **depth?**: `number`

#### Returns

`string`[]

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`readDirectory`](SolutionBuilderHostBase.md#readdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9731

***

### readFile()

```ts
readFile(path, encoding?): undefined | string
```

Use to read file text for source files and
if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well

#### Parameters

• **path**: `string`

• **encoding?**: `string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`readFile`](SolutionBuilderHostBase.md#readfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9725

***

### realpath()?

```ts
optional realpath(path): string
```

Symbol links resolution

#### Parameters

• **path**: `string`

#### Returns

`string`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`realpath`](SolutionBuilderHostBase.md#realpath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9733

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

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveModuleNameLiterals`](SolutionBuilderHostBase.md#resolvemodulenameliterals)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9750

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

If provided, used to resolve the module names, otherwise typescript's default module resolution

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveModuleNames`](SolutionBuilderHostBase.md#resolvemodulenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9743

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

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveTypeReferenceDirectiveReferences`](SolutionBuilderHostBase.md#resolvetypereferencedirectivereferences)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9751

***

### ~~resolveTypeReferenceDirectives()?~~

```ts
optional resolveTypeReferenceDirectives(
   typeReferenceDirectiveNames, 
   containingFile, 
   redirectedReference, 
   options, 
   containingFileMode?): (undefined | ResolvedTypeReferenceDirective)[]
```

#### Parameters

• **typeReferenceDirectiveNames**: `string`[] \| readonly [`FileReference`](FileReference.md)[]

• **containingFile**: `string`

• **redirectedReference**: `undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md)

• **options**: [`CompilerOptions`](CompilerOptions.md)

• **containingFileMode?**: [`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Returns

(`undefined` \| [`ResolvedTypeReferenceDirective`](ResolvedTypeReferenceDirective.md))[]

#### Deprecated

supply resolveTypeReferenceDirectiveReferences instead for resolution that can handle newer resolution modes like nodenext

If provided, used to resolve type reference directives, otherwise typescript's default resolution

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`resolveTypeReferenceDirectives`](SolutionBuilderHostBase.md#resolvetypereferencedirectives)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9749

***

### setModifiedTime()

```ts
setModifiedTime(fileName, date): void
```

#### Parameters

• **fileName**: `string`

• **date**: `Date`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`setModifiedTime`](SolutionBuilderHostBase.md#setmodifiedtime)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9851

***

### setTimeout()?

```ts
optional setTimeout(
   callback, 
   ms, ...
   args): any
```

If provided, will be used to set delayed compilation, so that multiple changes in short span are compiled together

#### Parameters

• **callback**

• **ms**: `number`

• ...**args**: `any`[]

#### Returns

`any`

#### Inherited from

[`WatchHost`](WatchHost.md).[`setTimeout`](WatchHost.md#settimeout)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9700

***

### trace()?

```ts
optional trace(s): void
```

If provided would be used to write log about compilation

#### Parameters

• **s**: `string`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`trace`](SolutionBuilderHostBase.md#trace)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9735

***

### useCaseSensitiveFileNames()

```ts
useCaseSensitiveFileNames(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`useCaseSensitiveFileNames`](SolutionBuilderHostBase.md#usecasesensitivefilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9710

***

### watchDirectory()

```ts
watchDirectory(
   path, 
   callback, 
   recursive?, 
   options?): FileWatcher
```

Used to watch resolved module's failed lookup locations, config file specs, type roots where auto type reference directives are added

#### Parameters

• **path**: `string`

• **callback**: [`DirectoryWatcherCallback`](../type-aliases/DirectoryWatcherCallback.md)

• **recursive?**: `boolean`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Inherited from

[`WatchHost`](WatchHost.md).[`watchDirectory`](WatchHost.md#watchdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9698

***

### watchFile()

```ts
watchFile(
   path, 
   callback, 
   pollingInterval?, 
   options?): FileWatcher
```

Used to watch changes in source files, missing files needed to update the program or config file

#### Parameters

• **path**: `string`

• **callback**: [`FileWatcherCallback`](../type-aliases/FileWatcherCallback.md)

• **pollingInterval?**: `number`

• **options?**: [`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Inherited from

[`WatchHost`](WatchHost.md).[`watchFile`](WatchHost.md#watchfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9696

***

### writeFile()?

```ts
optional writeFile(
   path, 
   data, 
   writeByteOrderMark?): void
```

Should provide create directory and writeFile if done of invalidatedProjects is not invoked with
writeFileCallback

#### Parameters

• **path**: `string`

• **data**: `string`

• **writeByteOrderMark?**: `boolean`

#### Returns

`void`

#### Inherited from

[`SolutionBuilderHostBase`](SolutionBuilderHostBase.md).[`writeFile`](SolutionBuilderHostBase.md#writefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9848
