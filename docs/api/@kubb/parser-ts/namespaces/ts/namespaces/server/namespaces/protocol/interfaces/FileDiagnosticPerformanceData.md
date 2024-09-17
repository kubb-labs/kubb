[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FileDiagnosticPerformanceData

# FileDiagnosticPerformanceData

Time spent computing each kind of diagnostics, in milliseconds.

## Extends

- [`DiagnosticPerformanceData`](../type-aliases/DiagnosticPerformanceData.md)

## Properties

### file

```ts
file: string;
```

The file for which the performance data is reported.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:232

***

### regionSemanticDiag

```ts
regionSemanticDiag: undefined | number;
```

#### Inherited from

`DiagnosticPerformanceData.regionSemanticDiag`

***

### semanticDiag

```ts
semanticDiag: undefined | number;
```

#### Inherited from

`DiagnosticPerformanceData.semanticDiag`

***

### suggestionDiag

```ts
suggestionDiag: undefined | number;
```

#### Inherited from

`DiagnosticPerformanceData.suggestionDiag`

***

### syntaxDiag

```ts
syntaxDiag: undefined | number;
```

#### Inherited from

`DiagnosticPerformanceData.syntaxDiag`
