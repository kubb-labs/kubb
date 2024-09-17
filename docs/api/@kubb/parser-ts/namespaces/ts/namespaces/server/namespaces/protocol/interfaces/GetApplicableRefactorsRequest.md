[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GetApplicableRefactorsRequest

# GetApplicableRefactorsRequest

Request refactorings at a given position or selection area.

## Extends

- [`Request`](Request.md)

## Properties

### arguments

```ts
arguments: GetApplicableRefactorsRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:457

***

### command

```ts
command: GetApplicableRefactors;
```

The command to execute

#### Overrides

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:456

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
