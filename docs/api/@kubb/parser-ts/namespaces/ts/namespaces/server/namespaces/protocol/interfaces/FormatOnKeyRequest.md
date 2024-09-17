[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / FormatOnKeyRequest

# FormatOnKeyRequest

Format on key request; value of command field is
"formatonkey". Given file location and key typed (as string),
return response giving zero or more edit instructions.  The
edit instructions will be sorted in file order.  Applying the
edit instructions in reverse to file will result in correctly
reformatted text.

## Extends

- [`FileLocationRequest`](FileLocationRequest.md)

## Properties

### arguments

```ts
arguments: FormatOnKeyRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`arguments`](FileLocationRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1603

***

### command

```ts
command: Formatonkey;
```

The command to execute

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`command`](FileLocationRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1602

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
