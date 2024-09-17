[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / WatchCompilerHostOfFilesAndCompilerOptions

# WatchCompilerHostOfFilesAndCompilerOptions\<T\>

Host to create watch with root files and options

## Extends

- [`WatchCompilerHost`](WatchCompilerHost.md)\<`T`\>

## Type Parameters

• **T** *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### createProgram

```ts
createProgram: CreateProgram<T>;
```

Used to create the program when need for program creation or recreation detected

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`createProgram`](WatchCompilerHost.md#createprogram)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9709

***

### jsDocParsingMode?

```ts
optional jsDocParsingMode: JSDocParsingMode;
```

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`jsDocParsingMode`](WatchCompilerHost.md#jsdocparsingmode)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9758

***

### options

```ts
options: CompilerOptions;
```

Compiler options

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9775

***

### preferNonRecursiveWatch?

```ts
optional preferNonRecursiveWatch: boolean;
```

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`preferNonRecursiveWatch`](WatchCompilerHost.md#prefernonrecursivewatch)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9703

***

### projectReferences?

```ts
optional projectReferences: readonly ProjectReference[];
```

Project References

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9778

***

### rootFiles

```ts
rootFiles: string[];
```

root files to use to generate program

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9773

***

### watchOptions?

```ts
optional watchOptions: WatchOptions;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9776

## Methods

### afterProgramCreate()?

```ts
optional afterProgramCreate(program): void
```

If provided, callback to invoke after every new program creation

#### Parameters

• **program**: `T`

#### Returns

`void`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`afterProgramCreate`](WatchCompilerHost.md#afterprogramcreate)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9766

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`clearTimeout`](WatchCompilerHost.md#cleartimeout)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9702

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`createHash`](WatchCompilerHost.md#createhash)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9715

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`directoryExists`](WatchCompilerHost.md#directoryexists)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`fileExists`](WatchCompilerHost.md#fileexists)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getCurrentDirectory`](WatchCompilerHost.md#getcurrentdirectory)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDefaultLibFileName`](WatchCompilerHost.md#getdefaultlibfilename)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDefaultLibLocation`](WatchCompilerHost.md#getdefaultliblocation)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getDirectories`](WatchCompilerHost.md#getdirectories)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getEnvironmentVariable`](WatchCompilerHost.md#getenvironmentvariable)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9737

***

### getModuleResolutionCache()?

```ts
optional getModuleResolutionCache(): undefined | ModuleResolutionCache
```

Returns the module resolution cache used by a provided `resolveModuleNames` implementation so that any non-name module resolution operations (eg, package.json lookup) can reuse it

#### Returns

`undefined` \| [`ModuleResolutionCache`](ModuleResolutionCache.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getModuleResolutionCache`](WatchCompilerHost.md#getmoduleresolutioncache)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`getNewLine`](WatchCompilerHost.md#getnewline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9711

***

### getParsedCommandLine()?

```ts
optional getParsedCommandLine(fileName): undefined | ParsedCommandLine
```

If provided, use this method to get parsed command lines for referenced projects

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`ParsedCommandLine`](ParsedCommandLine.md)

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`getParsedCommandLine`](WatchCompilerHost.md#getparsedcommandline)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9764

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`hasInvalidatedResolutions`](WatchCompilerHost.md#hasinvalidatedresolutions)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`onWatchStatusChange`](WatchCompilerHost.md#onwatchstatuschange)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`readDirectory`](WatchCompilerHost.md#readdirectory)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`readFile`](WatchCompilerHost.md#readfile)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`realpath`](WatchCompilerHost.md#realpath)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveModuleNameLiterals`](WatchCompilerHost.md#resolvemodulenameliterals)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveModuleNames`](WatchCompilerHost.md#resolvemodulenames)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveTypeReferenceDirectiveReferences`](WatchCompilerHost.md#resolvetypereferencedirectivereferences)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`resolveTypeReferenceDirectives`](WatchCompilerHost.md#resolvetypereferencedirectives)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9749

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`setTimeout`](WatchCompilerHost.md#settimeout)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`trace`](WatchCompilerHost.md#trace)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`useCaseSensitiveFileNames`](WatchCompilerHost.md#usecasesensitivefilenames)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9710

***

### useSourceOfProjectReferenceRedirect()?

```ts
optional useSourceOfProjectReferenceRedirect(): boolean
```

Instead of using output d.ts file from project reference, use its source file

#### Returns

`boolean`

#### Inherited from

[`WatchCompilerHost`](WatchCompilerHost.md).[`useSourceOfProjectReferenceRedirect`](WatchCompilerHost.md#usesourceofprojectreferenceredirect)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9762

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`watchDirectory`](WatchCompilerHost.md#watchdirectory)

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

[`WatchCompilerHost`](WatchCompilerHost.md).[`watchFile`](WatchCompilerHost.md#watchfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9696
