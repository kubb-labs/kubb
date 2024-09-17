[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / Message

# Message

A TypeScript Server message

## Extended by

- [`Request`](Request.md)
- [`Event`](Event.md)
- [`Response`](Response.md)

## Properties

### seq

```ts
seq: number;
```

Sequence number of the message

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### type

```ts
type: "request" | "response" | "event";
```

One of "request", "response", or "event"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:137
