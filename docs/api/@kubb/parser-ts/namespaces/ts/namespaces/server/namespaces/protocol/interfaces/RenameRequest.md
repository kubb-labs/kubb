[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / RenameRequest

# RenameRequest

Rename request; value of command field is "rename". Return
response giving the file locations that reference the symbol
found in file at location line, col. Also return full display
name of the symbol so that client can print it unambiguously.

## Extends

- [`FileLocationRequest`](FileLocationRequest.md)

## Properties

### arguments

```ts
arguments: RenameRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`arguments`](FileLocationRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:971

***

### command

```ts
command: Rename;
```

The command to execute

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`command`](FileLocationRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:970

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
