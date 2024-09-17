[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / CloseRequest

# CloseRequest

Close request; value of command field is "close". Notify the
server that the client has closed a previously open file.  If
file is still referenced by open files, the server will resume
monitoring the filesystem for changes to file.  Server does not
currently send a response to a close request.

## Extends

- [`FileRequest`](FileRequest.md)

## Properties

### arguments

```ts
arguments: FileRequestArgs;
```

Object containing arguments for the command

#### Inherited from

[`FileRequest`](FileRequest.md).[`arguments`](FileRequest.md#arguments)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:435

***

### command

```ts
command: Close;
```

The command to execute

#### Overrides

[`FileRequest`](FileRequest.md).[`command`](FileRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:1378

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
