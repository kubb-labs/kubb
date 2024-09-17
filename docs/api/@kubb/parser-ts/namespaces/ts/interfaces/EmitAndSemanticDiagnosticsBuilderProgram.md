[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / EmitAndSemanticDiagnosticsBuilderProgram

# EmitAndSemanticDiagnosticsBuilderProgram

The builder that can handle the changes in program and iterate through changed file to emit the files
The semantic diagnostics are cached per file and managed by clearing for the changed/affected files

## Extends

- [`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md)

## Methods

### emit()

```ts
emit(
   targetSourceFile?, 
   writeFile?, 
   cancellationToken?, 
   emitOnlyDtsFiles?, 
   customTransformers?): EmitResult
```

Emits the JavaScript and declaration files.
When targetSource file is specified, emits the files corresponding to that source file,
otherwise for the whole program.
In case of EmitAndSemanticDiagnosticsBuilderProgram, when targetSourceFile is specified,
it is assumed that that file is handled from affected file list. If targetSourceFile is not specified,
it will only emit all the affected files instead of whole program

The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
in that order would be used to write the files

#### Parameters

• **targetSourceFile?**: [`SourceFile`](SourceFile.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **emitOnlyDtsFiles?**: `boolean`

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`EmitResult`](EmitResult.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`emit`](SemanticDiagnosticsBuilderProgram.md#emit)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9631

***

### emitNextAffectedFile()

```ts
emitNextAffectedFile(
   writeFile?, 
   cancellationToken?, 
   emitOnlyDtsFiles?, 
customTransformers?): AffectedFileResult<EmitResult>
```

Emits the next affected file's emit result (EmitResult and sourceFiles emitted) or returns undefined if iteration is complete
The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
in that order would be used to write the files

#### Parameters

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **emitOnlyDtsFiles?**: `boolean`

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<[`EmitResult`](EmitResult.md)\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9657

***

### getAllDependencies()

```ts
getAllDependencies(sourceFile): readonly string[]
```

Get all the dependencies of the file

#### Parameters

• **sourceFile**: [`SourceFile`](SourceFile.md)

#### Returns

readonly `string`[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getAllDependencies`](SemanticDiagnosticsBuilderProgram.md#getalldependencies)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9610

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

Get compiler options of the program

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getCompilerOptions`](SemanticDiagnosticsBuilderProgram.md#getcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9578

***

### getConfigFileParsingDiagnostics()

```ts
getConfigFileParsingDiagnostics(): readonly Diagnostic[]
```

Get the diagnostics from config file parsing

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getConfigFileParsingDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getconfigfileparsingdiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9598

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

Get the current directory of the program

#### Returns

`string`

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getCurrentDirectory`](SemanticDiagnosticsBuilderProgram.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9635

***

### getDeclarationDiagnostics()

```ts
getDeclarationDiagnostics(sourceFile?, cancellationToken?): readonly DiagnosticWithLocation[]
```

Get the declaration diagnostics, for all source files if source file is not supplied

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getDeclarationDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getdeclarationdiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9606

***

### getGlobalDiagnostics()

```ts
getGlobalDiagnostics(cancellationToken?): readonly Diagnostic[]
```

Get the diagnostics that dont belong to any file

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getGlobalDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getglobaldiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9594

***

### getOptionsDiagnostics()

```ts
getOptionsDiagnostics(cancellationToken?): readonly Diagnostic[]
```

Get the diagnostics for compiler options

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getOptionsDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getoptionsdiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9590

***

### getProgram()

```ts
getProgram(): Program
```

Returns current program

#### Returns

[`Program`](Program.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getProgram`](SemanticDiagnosticsBuilderProgram.md#getprogram)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9574

***

### getSemanticDiagnostics()

```ts
getSemanticDiagnostics(sourceFile?, cancellationToken?): readonly Diagnostic[]
```

Gets the semantic diagnostics from the program corresponding to this state of file (if provided) or whole program
The semantic diagnostics are cached and managed here
Note that it is assumed that when asked about semantic diagnostics through this API,
the file has been taken out of affected files so it is safe to use cache or get from program and cache the diagnostics
In case of SemanticDiagnosticsBuilderProgram if the source file is not provided,
it will iterate through all the affected files, to ensure that cache stays valid and yet provide a way to get all semantic diagnostics

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSemanticDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getsemanticdiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9619

***

### getSemanticDiagnosticsOfNextAffectedFile()

```ts
getSemanticDiagnosticsOfNextAffectedFile(cancellationToken?, ignoreSourceFile?): AffectedFileResult<readonly Diagnostic[]>
```

Gets the semantic diagnostics from the program for the next affected file and caches it
Returns undefined if the iteration is complete

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **ignoreSourceFile?**

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSemanticDiagnosticsOfNextAffectedFile`](SemanticDiagnosticsBuilderProgram.md#getsemanticdiagnosticsofnextaffectedfile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9645

***

### getSourceFile()

```ts
getSourceFile(fileName): undefined | SourceFile
```

Get the source file in the program with file name

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSourceFile`](SemanticDiagnosticsBuilderProgram.md#getsourcefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9582

***

### getSourceFiles()

```ts
getSourceFiles(): readonly SourceFile[]
```

Get a list of files in the program

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSourceFiles`](SemanticDiagnosticsBuilderProgram.md#getsourcefiles)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9586

***

### getSyntacticDiagnostics()

```ts
getSyntacticDiagnostics(sourceFile?, cancellationToken?): readonly Diagnostic[]
```

Get the syntax diagnostics, for all source files if source file is not supplied

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[`SemanticDiagnosticsBuilderProgram`](SemanticDiagnosticsBuilderProgram.md).[`getSyntacticDiagnostics`](SemanticDiagnosticsBuilderProgram.md#getsyntacticdiagnostics)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9602
