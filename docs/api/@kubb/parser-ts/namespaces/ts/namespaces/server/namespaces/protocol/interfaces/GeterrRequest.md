[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / GeterrRequest

# GeterrRequest

Geterr request; value of command field is "geterr". Wait for
delay milliseconds and then, if during the wait no change or
reload messages have arrived for the first file in the files
list, get the syntactic errors for the file, field requests,
and then get the semantic errors for the file.  Repeat with a
smaller delay for each subsequent file on the files list.  Best
practice for an editor is to send a file list containing each
file that is currently visible, in most-recently-used order.

## Extends

- [`Request`](Request.md)

## Properties

### arguments

```ts
arguments: GeterrRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1888

***

### command

```ts
command: Geterr;
```

The command to execute

#### Overrides

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1887

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
