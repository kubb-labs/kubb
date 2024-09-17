[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createSolutionBuilderWithWatchHost

# createSolutionBuilderWithWatchHost()

```ts
function createSolutionBuilderWithWatchHost<T>(
   system?, 
   createProgram?, 
   reportDiagnostic?, 
   reportSolutionBuilderStatus?, 
reportWatchStatus?): SolutionBuilderWithWatchHost<T>
```

## Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md) = [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

## Parameters

• **system?**: [`System`](../interfaces/System.md)

• **createProgram?**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

• **reportDiagnostic?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportSolutionBuilderStatus?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportWatchStatus?**: [`WatchStatusReporter`](../type-aliases/WatchStatusReporter.md)

## Returns

[`SolutionBuilderWithWatchHost`](../interfaces/SolutionBuilderWithWatchHost.md)\<`T`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9819
