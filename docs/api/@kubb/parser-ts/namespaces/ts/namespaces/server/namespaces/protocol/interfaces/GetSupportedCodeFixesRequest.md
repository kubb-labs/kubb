[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GetSupportedCodeFixesRequest

# GetSupportedCodeFixesRequest

A request to get codes of supported code fixes.

## Extends

- [`Request`](Request.md)

## Properties

### arguments?

```ts
optional arguments: Partial<FileRequestArgs>;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:643

***

### command

```ts
command: GetSupportedCodeFixes;
```

The command to execute

#### Overrides

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:642

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Request`](Request.md).[`seq`](Request.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`Request`](Request.md).[`type`](Request.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
