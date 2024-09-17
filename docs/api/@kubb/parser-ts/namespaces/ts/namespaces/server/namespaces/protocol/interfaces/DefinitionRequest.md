[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DefinitionRequest

# DefinitionRequest

Go to definition request; value of command field is
"definition". Return response giving the file locations that
define the symbol found in file at location line, col.

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
command: Definition;
```

The command to execute

#### Overrides

[`FileLocationRequest`](FileLocationRequest.md).[`command`](FileLocationRequest.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:705

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
