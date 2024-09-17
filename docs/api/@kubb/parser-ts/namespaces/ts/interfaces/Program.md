[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / Program

# Program

## Extends

- [`ScriptReferenceHost`](ScriptReferenceHost.md)

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

Emits the JavaScript and declaration files.  If targetSourceFile is not specified, then
the JavaScript and declaration files will be produced for all the files in this program.
If targetSourceFile is specified, then only the JavaScript and declaration for that
specific file will be generated.

If writeFile is not specified then the writeFile callback from the compiler host will be
used for writing the JavaScript and declaration files.  Otherwise, the writeFile parameter
will be invoked when writing the JavaScript and declaration files.

#### Parameters

• **targetSourceFile?**: [`SourceFile`](SourceFile.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **emitOnlyDtsFiles?**: `boolean`

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`EmitResult`](EmitResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5971

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getCompilerOptions`](ScriptReferenceHost.md#getcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5917

***

### getConfigFileParsingDiagnostics()

```ts
getConfigFileParsingDiagnostics(): readonly Diagnostic[]
```

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5978

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Overrides

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getCurrentDirectory`](ScriptReferenceHost.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5952

***

### getDeclarationDiagnostics()

```ts
getDeclarationDiagnostics(sourceFile?, cancellationToken?): readonly DiagnosticWithLocation[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5977

***

### getGlobalDiagnostics()

```ts
getGlobalDiagnostics(cancellationToken?): readonly Diagnostic[]
```

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5973

***

### getIdentifierCount()

```ts
getIdentifierCount(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5984

***

### getInstantiationCount()

```ts
getInstantiationCount(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5987

***

### getModeForResolutionAtIndex()

```ts
getModeForResolutionAtIndex(file, index): ResolutionMode
```

Calculates the final resolution mode for an import at some index within a file's `imports` list. This function only returns a result
when module resolution settings allow differing resolution between ESM imports and CJS requires, or when a mode is explicitly provided
via import attributes, which cause an `import` or `require` condition to be used during resolution regardless of module resolution
settings. In absence of overriding attributes, and in modes that support differing resolution, the result indicates the syntax the
usage would emit to JavaScript. Some examples:

```ts
// tsc foo.mts --module nodenext
import {} from "mod";
// Result: ESNext - the import emits as ESM due to `impliedNodeFormat` set by .mts file extension

// tsc foo.cts --module nodenext
import {} from "mod";
// Result: CommonJS - the import emits as CJS due to `impliedNodeFormat` set by .cts file extension

// tsc foo.ts --module preserve --moduleResolution bundler
import {} from "mod";
// Result: ESNext - the import emits as ESM due to `--module preserve` and `--moduleResolution bundler`
// supports conditional imports/exports

// tsc foo.ts --module preserve --moduleResolution node10
import {} from "mod";
// Result: undefined - the import emits as ESM due to `--module preserve`, but `--moduleResolution node10`
// does not support conditional imports/exports

// tsc foo.ts --module commonjs --moduleResolution node10
import type {} from "mod" with { "resolution-mode": "import" };
// Result: ESNext - conditional imports/exports always supported with "resolution-mode" attribute
```

#### Parameters

• **file**: [`SourceFile`](SourceFile.md)

• **index**: `number`

#### Returns

[`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6059

***

### getModeForUsageLocation()

```ts
getModeForUsageLocation(file, usage): ResolutionMode
```

Calculates the final resolution mode for a given module reference node. This function only returns a result when module resolution
settings allow differing resolution between ESM imports and CJS requires, or when a mode is explicitly provided via import attributes,
which cause an `import` or `require` condition to be used during resolution regardless of module resolution settings. In absence of
overriding attributes, and in modes that support differing resolution, the result indicates the syntax the usage would emit to JavaScript.
Some examples:

```ts
// tsc foo.mts --module nodenext
import {} from "mod";
// Result: ESNext - the import emits as ESM due to `impliedNodeFormat` set by .mts file extension

// tsc foo.cts --module nodenext
import {} from "mod";
// Result: CommonJS - the import emits as CJS due to `impliedNodeFormat` set by .cts file extension

// tsc foo.ts --module preserve --moduleResolution bundler
import {} from "mod";
// Result: ESNext - the import emits as ESM due to `--module preserve` and `--moduleResolution bundler`
// supports conditional imports/exports

// tsc foo.ts --module preserve --moduleResolution node10
import {} from "mod";
// Result: undefined - the import emits as ESM due to `--module preserve`, but `--moduleResolution node10`
// does not support conditional imports/exports

// tsc foo.ts --module commonjs --moduleResolution node10
import type {} from "mod" with { "resolution-mode": "import" };
// Result: ESNext - conditional imports/exports always supported with "resolution-mode" attribute
```

#### Parameters

• **file**: [`SourceFile`](SourceFile.md)

• **usage**: [`StringLiteralLike`](../type-aliases/StringLiteralLike.md)

#### Returns

[`ResolutionMode`](../type-aliases/ResolutionMode.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6027

***

### getNodeCount()

```ts
getNodeCount(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5983

***

### getOptionsDiagnostics()

```ts
getOptionsDiagnostics(cancellationToken?): readonly Diagnostic[]
```

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5972

***

### getProjectReferences()

```ts
getProjectReferences(): undefined | readonly ProjectReference[]
```

#### Returns

`undefined` \| readonly [`ProjectReference`](ProjectReference.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6060

***

### getRelationCacheSizes()

```ts
getRelationCacheSizes(): object
```

#### Returns

`object`

##### assignable

```ts
assignable: number;
```

##### identity

```ts
identity: number;
```

##### strictSubtype

```ts
strictSubtype: number;
```

##### subtype

```ts
subtype: number;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5988

***

### getResolvedProjectReferences()

```ts
getResolvedProjectReferences(): undefined | readonly (undefined | ResolvedProjectReference)[]
```

#### Returns

`undefined` \| readonly (`undefined` \| [`ResolvedProjectReference`](ResolvedProjectReference.md))[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6061

***

### getRootFileNames()

```ts
getRootFileNames(): readonly string[]
```

Get a list of root file names that were passed to a 'createProgram'

#### Returns

readonly `string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5956

***

### getSemanticDiagnostics()

```ts
getSemanticDiagnostics(sourceFile?, cancellationToken?): readonly Diagnostic[]
```

The first time this is called, it will return global diagnostics (no location).

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5976

***

### getSourceFile()

```ts
getSourceFile(fileName): undefined | SourceFile
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getSourceFile`](ScriptReferenceHost.md#getsourcefile)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5918

***

### getSourceFileByPath()

```ts
getSourceFileByPath(path): undefined | SourceFile
```

#### Parameters

• **path**: [`Path`](../type-aliases/Path.md)

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Inherited from

[`ScriptReferenceHost`](ScriptReferenceHost.md).[`getSourceFileByPath`](ScriptReferenceHost.md#getsourcefilebypath)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5919

***

### getSourceFiles()

```ts
getSourceFiles(): readonly SourceFile[]
```

Get a list of files in the program

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5960

***

### getSymbolCount()

```ts
getSymbolCount(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5985

***

### getSyntacticDiagnostics()

```ts
getSyntacticDiagnostics(sourceFile?, cancellationToken?): readonly DiagnosticWithLocation[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5974

***

### getTypeChecker()

```ts
getTypeChecker(): TypeChecker
```

Gets a type checker that can be used to semantically analyze source files in the program.

#### Returns

[`TypeChecker`](TypeChecker.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5982

***

### getTypeCount()

```ts
getTypeCount(): number
```

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5986

***

### isSourceFileDefaultLibrary()

```ts
isSourceFileDefaultLibrary(file): boolean
```

#### Parameters

• **file**: [`SourceFile`](SourceFile.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5995

***

### isSourceFileFromExternalLibrary()

```ts
isSourceFileFromExternalLibrary(file): boolean
```

#### Parameters

• **file**: [`SourceFile`](SourceFile.md)

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:5994
