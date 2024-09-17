[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / createSolutionBuilderHost

# createSolutionBuilderHost()

```ts
function createSolutionBuilderHost<T>(
   system?, 
   createProgram?, 
   reportDiagnostic?, 
   reportSolutionBuilderStatus?, 
reportErrorSummary?): SolutionBuilderHost<T>
```

## Type Parameters

• **T** *extends* [`BuilderProgram`](../interfaces/BuilderProgram.md) = [`EmitAndSemanticDiagnosticsBuilderProgram`](../interfaces/EmitAndSemanticDiagnosticsBuilderProgram.md)

## Parameters

• **system?**: [`System`](../interfaces/System.md)

• **createProgram?**: [`CreateProgram`](../type-aliases/CreateProgram.md)\<`T`\>

• **reportDiagnostic?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportSolutionBuilderStatus?**: [`DiagnosticReporter`](../type-aliases/DiagnosticReporter.md)

• **reportErrorSummary?**: [`ReportEmitErrorSummary`](../type-aliases/ReportEmitErrorSummary.md)

## Returns

[`SolutionBuilderHost`](../interfaces/SolutionBuilderHost.md)\<`T`\>

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9818
