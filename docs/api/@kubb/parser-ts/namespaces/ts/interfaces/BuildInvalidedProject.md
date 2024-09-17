[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / BuildInvalidedProject

# BuildInvalidedProject\<T\>

## Extends

- [`InvalidatedProjectBase`](InvalidatedProjectBase.md)

## Type Parameters

• **T** *extends* [`BuilderProgram`](BuilderProgram.md)

## Properties

### kind

```ts
readonly kind: Build;
```

#### Overrides

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`kind`](InvalidatedProjectBase.md#kind)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9889

***

### project

```ts
readonly project: ResolvedConfigFileName;
```

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`project`](InvalidatedProjectBase.md#project)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9876

## Methods

### done()

```ts
done(
   cancellationToken?, 
   writeFile?, 
   customTransformers?): ExitStatus
```

To dispose this project and ensure that all the necessary actions are taken and state is updated accordingly

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`done`](InvalidatedProjectBase.md#done)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9880

***

### emit()

```ts
emit(
   targetSourceFile?, 
   writeFile?, 
   cancellationToken?, 
   emitOnlyDtsFiles?, 
   customTransformers?): undefined | EmitResult
```

#### Parameters

• **targetSourceFile?**: [`SourceFile`](SourceFile.md)

• **writeFile?**: [`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **emitOnlyDtsFiles?**: `boolean`

• **customTransformers?**: [`CustomTransformers`](CustomTransformers.md)

#### Returns

`undefined` \| [`EmitResult`](EmitResult.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9901

***

### getAllDependencies()

```ts
getAllDependencies(sourceFile): readonly string[]
```

#### Parameters

• **sourceFile**: [`SourceFile`](SourceFile.md)

#### Returns

readonly `string`[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9898

***

### getBuilderProgram()

```ts
getBuilderProgram(): undefined | T
```

#### Returns

`undefined` \| `T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9890

***

### getCompilerOptions()

```ts
getCompilerOptions(): CompilerOptions
```

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCompilerOptions`](InvalidatedProjectBase.md#getcompileroptions)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9881

***

### getConfigFileParsingDiagnostics()

```ts
getConfigFileParsingDiagnostics(): readonly Diagnostic[]
```

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9896

***

### getCurrentDirectory()

```ts
getCurrentDirectory(): string
```

#### Returns

`string`

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCurrentDirectory`](InvalidatedProjectBase.md#getcurrentdirectory)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9882

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9895

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

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9894

***

### getProgram()

```ts
getProgram(): undefined | Program
```

#### Returns

`undefined` \| [`Program`](Program.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9891

***

### getSemanticDiagnostics()

```ts
getSemanticDiagnostics(sourceFile?, cancellationToken?): readonly Diagnostic[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9899

***

### getSemanticDiagnosticsOfNextAffectedFile()

```ts
getSemanticDiagnosticsOfNextAffectedFile(cancellationToken?, ignoreSourceFile?): AffectedFileResult<readonly Diagnostic[]>
```

#### Parameters

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

• **ignoreSourceFile?**

#### Returns

[`AffectedFileResult`](../type-aliases/AffectedFileResult.md)\<readonly [`Diagnostic`](Diagnostic.md)[]\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9900

***

### getSourceFile()

```ts
getSourceFile(fileName): undefined | SourceFile
```

#### Parameters

• **fileName**: `string`

#### Returns

`undefined` \| [`SourceFile`](SourceFile.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9892

***

### getSourceFiles()

```ts
getSourceFiles(): readonly SourceFile[]
```

#### Returns

readonly [`SourceFile`](SourceFile.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9893

***

### getSyntacticDiagnostics()

```ts
getSyntacticDiagnostics(sourceFile?, cancellationToken?): readonly Diagnostic[]
```

#### Parameters

• **sourceFile?**: [`SourceFile`](SourceFile.md)

• **cancellationToken?**: [`CancellationToken`](CancellationToken.md)

#### Returns

readonly [`Diagnostic`](Diagnostic.md)[]

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9897
