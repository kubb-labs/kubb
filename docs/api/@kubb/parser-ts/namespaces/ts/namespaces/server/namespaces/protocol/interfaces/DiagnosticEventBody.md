[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DiagnosticEventBody

# DiagnosticEventBody

## Properties

### diagnostics

```ts
diagnostics: Diagnostic[];
```

An array of diagnostic information items.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1993

***

### file

```ts
file: string;
```

The file for which diagnostic information is reported.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1989

***

### spans?

```ts
optional spans: TextSpan[];
```

Spans where the region diagnostic was requested, if this is a region semantic diagnostic event.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1997
