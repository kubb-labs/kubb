[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / ProjectLanguageServiceStateEvent

# ProjectLanguageServiceStateEvent

Server-initiated event message

## Extends

- [`Event`](Event.md)

## Properties

### body?

```ts
optional body: ProjectLanguageServiceStateEventBody;
```

Event-specific information

#### Overrides

[`Event`](Event.md).[`body`](Event.md#body)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2033

***

### event

```ts
event: "projectLanguageServiceState";
```

Name of event

#### Overrides

[`Event`](Event.md).[`event`](Event.md#event)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:2032

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
