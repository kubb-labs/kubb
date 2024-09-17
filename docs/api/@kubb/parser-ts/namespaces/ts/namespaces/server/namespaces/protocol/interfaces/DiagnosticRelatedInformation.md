[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DiagnosticRelatedInformation

# DiagnosticRelatedInformation

Represents additional spans returned with a diagnostic which are relevant to it

## Properties

### category

```ts
category: string;
```

The category of the related information message, e.g. "error", "warning", or "suggestion".

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1971

***

### code

```ts
code: number;
```

The code used ot identify the related information

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1975

***

### message

```ts
message: string;
```

Text of related or additional information.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1979

***

### span?

```ts
optional span: FileSpan;
```

Associated location

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1983
