[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createAbstractBuilder

# createAbstractBuilder()

## createAbstractBuilder(newProgram, host, oldProgram, configFileParsingDiagnostics)

```ts
function createAbstractBuilder(
   newProgram, 
   host, 
   oldProgram?, 
   configFileParsingDiagnostics?): BuilderProgram
```

Creates a builder thats just abstraction over program and can be used with watch

### Parameters

• **newProgram**: [`Program`](../interfaces/Program.md)

• **host**: [`BuilderProgramHost`](../interfaces/BuilderProgramHost.md)

• **oldProgram?**: [`BuilderProgram`](../interfaces/BuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

### Returns

[`BuilderProgram`](../interfaces/BuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9550

## createAbstractBuilder(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences)

```ts
function createAbstractBuilder(
   rootNames, 
   options, 
   host?, 
   oldProgram?, 
   configFileParsingDiagnostics?, 
   projectReferences?): BuilderProgram
```

### Parameters

• **rootNames**: `undefined` \| readonly `string`[]

• **options**: `undefined` \| [`CompilerOptions`](../interfaces/CompilerOptions.md)

• **host?**: [`CompilerHost`](../interfaces/CompilerHost.md)

• **oldProgram?**: [`BuilderProgram`](../interfaces/BuilderProgram.md)

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

• **projectReferences?**: readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

### Returns

[`BuilderProgram`](../interfaces/BuilderProgram.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9551
