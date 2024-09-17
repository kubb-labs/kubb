[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / CreateProgram

# CreateProgram()\<T\>

```ts
type CreateProgram<T>: (rootNames, options, host?, oldProgram?, configFileParsingDiagnostics?, projectReferences?) => T;
```

Create the program with rootNames and options, if they are undefined, oldProgram and new configFile diagnostics create new program

## Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md)

## Parameters

• **rootNames**: readonly `string`[] \| `undefined`

• **options**: [`CompilerOptions`](../interfaces/CompilerOptions.md) \| `undefined`

• **host?**: [`CompilerHost`](../interfaces/CompilerHost.md)

• **oldProgram?**: `T`

• **configFileParsingDiagnostics?**: readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]

• **projectReferences?**: readonly [`ProjectReference`](../interfaces/ProjectReference.md)[]

## Returns

`T`

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9690
