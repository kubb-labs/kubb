[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / SyntacticDiagnosticsSyncRequest

# SyntacticDiagnosticsSyncRequest

Synchronous request for syntactic diagnostics of one file.

## Extends

- [`FileRequest`](FileRequest.md)

## Properties

### arguments

```ts
arguments: SyntacticDiagnosticsSyncRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`FileRequest`](FileRequest.md).[`arguments`](FileRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1827

***

### command

```ts
command: SyntacticDiagnosticsSync;
```

The command to execute

#### Overrides

[`FileRequest`](FileRequest.md).[`command`](FileRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1826

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`FileRequest`](FileRequest.md).[`seq`](FileRequest.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`FileRequest`](FileRequest.md).[`type`](FileRequest.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
