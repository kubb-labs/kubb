[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createSemanticDiagnosticsBuilderProgram

# createSemanticDiagnosticsBuilderProgram()

## createSemanticDiagnosticsBuilderProgram(newProgram, host, oldProgram, configFileParsingDiagnostics)

```ts
function createSemanticDiagnosticsBuilderProgram(
   newProgram, 
   host, 
   oldProgram?, 
   configFileParsingDiagnostics?): SemanticDiagnosticsBuilderProgram
```

Create the builder to manage semantic diagnostics and cache them

### Parameters

• **newProgram**: [`Program`](../interfaces/Program.md)

• **host**: [`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

• **oldProgram?**: [`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9539

## createSemanticDiagnosticsBuilderProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences)

```ts
function createSemanticDiagnosticsBuilderProgram(
   rootNames, 
   options, 
   host?, 
   oldProgram?, 
   configFileParsingDiagnostics?, 
   projectReferences?): SemanticDiagnosticsBuilderProgram
```

### Parameters

• **rootNames**: `undefined` \| readonly `string`[]

• **options**: `undefined` \| [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host?**: [`CompilerHost`](../interfaces/CompilerHost.md)

• **oldProgram?**: [`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

• **projectReferences?**: readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`SemanticDiagnosticsBuilderProgram`](../interfaces/SemanticDiagnosticsBuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9540
