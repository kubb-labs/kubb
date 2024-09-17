[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ConfigFileDiagnosticEvent

# ConfigFileDiagnosticEvent

Event message for "configFileDiag" event type.
This event provides errors for a found config file.

## Extends

- [`Event`](Event.md)

## Properties

### body?

```ts
optional body: ConfigFileDiagnosticEventBody;
```

Event-specific information

#### Overrides

[`Event`](Event.md).[`body`](Event.md#body)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2027

***

### event

```ts
event: "configFileDiag";
```

Name of event

#### Overrides

[`Event`](Event.md).[`event`](Event.md#event)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2028

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Event`](Event.md).[`seq`](Event.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "event";
```

One of "request", "response", or "event"

#### Inherited from

[`Event`](Event.md).[`type`](Event.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:163
