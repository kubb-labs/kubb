[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createEmitAndSemanticDiagnosticsBuilderProgram

# createEmitAndSemanticDiagnosticsBuilderProgram()

## createEmitAndSemanticDiagnosticsBuilderProgram(newProgram, host, oldProgram, configFileParsingDiagnostics)

```ts
function createEmitAndSemanticDiagnosticsBuilderProgram(
   newProgram, 
   host, 
   oldProgram?, 
   configFileParsingDiagnostics?): EmitAndSemanticDiagnosticsBuilderProgram
```

Create the builder that can handle the changes in program and iterate through changed files
to emit the those files and manage semantic diagnostics cache as well

### Parameters

• **newProgram**: [`Program`](../interfaces/Program.md)

• **host**: [`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

• **oldProgram?**: [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9545

## createEmitAndSemanticDiagnosticsBuilderProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences)

```ts
function createEmitAndSemanticDiagnosticsBuilderProgram(
   rootNames, 
   options, 
   host?, 
   oldProgram?, 
   configFileParsingDiagnostics?, 
   projectReferences?): EmitAndSemanticDiagnosticsBuilderProgram
```

### Parameters

• **rootNames**: `undefined` \| readonly `string`[]

• **options**: `undefined` \| [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host?**: [`CompilerHost`](../interfaces/CompilerHost.md)

• **oldProgram?**: [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

• **projectReferences?**: readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9546
