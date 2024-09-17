[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / LinkedEditingRangeRequest

# LinkedEditingRangeRequest

A request whose arguments specify a file location (file, line, col).

## Extends

- [`FileLocationRequest`](FileLocationRequest.md)

## Properties

### arguments

```ts
arguments: FileLocationRequestArgs;
```

Object containing arguments for the command

#### Inherited from

[`FileLocationRequest`](FileLocationRequest.md).[`arguments`](FileLocationRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:636

***

### command

```ts
readonly command: LinkedEditingRange;
```

The command to execute

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`command`](FileLocationRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:835

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`FileLocationRequest`](FileLocationRequest.md).[`seq`](FileLocationRequest.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request";
```

One of "request", "response", or "event"

#### Inherited from

[`FileLocationRequest`](FileLocationRequest.md).[`type`](FileLocationRequest.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:143
