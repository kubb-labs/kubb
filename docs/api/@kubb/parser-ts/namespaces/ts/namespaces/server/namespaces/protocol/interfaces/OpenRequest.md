[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / OpenRequest

# OpenRequest

Open request; value of command field is "open". Notify the
server that the client has file open.  The server will not
monitor the filesystem for changes in this file and will assume
that the client is updating the server (using the change and/or
reload messages) when the file changes. Server does not currently
send a response to an open request.

## Extends

- [`Request`](Request.md)

## Properties

### arguments

```ts
arguments: OpenRequestArgs;
```

Object containing arguments for the command

#### Overrides

[`Request`](Request.md).[`arguments`](Request.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1238

***

### command

```ts
command: Open;
```

The command to execute

#### Overrides

[`Request`](Request.md).[`command`](Request.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1237

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
