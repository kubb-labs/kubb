[API](../../../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../../../index.md) / [ts](../../../../../index.md) / [server](../../../index.md) / [protocol](../index.md) / DefinitionAndBoundSpanResponse

# DefinitionAndBoundSpanResponse

Response by server to client request message.

## Extends

- [`Response`](Response.md)

## Properties

### body

```ts
readonly body: DefinitionInfoAndBoundSpan;
```

Contains message body if success === true.

#### Overrides

[`Response`](Response.md).[`body`](Response.md#body)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:714

***

### command

```ts
command: string;
```

The command requested.

#### Inherited from

[`Response`](Response.md).[`command`](Response.md#command)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:189

***

### message?

```ts
optional message: string;
```

If success === false, this should always be provided.
Otherwise, may (or may not) contain a success message.

#### Inherited from

[`Response`](Response.md).[`message`](Response.md#message)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:194

***

### metadata?

```ts
optional metadata: unknown;
```

Contains extra information that plugin can include to be passed on

#### Inherited from

[`Response`](Response.md).[`metadata`](Response.md#metadata)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:202

***

### performanceData?

```ts
optional performanceData: PerformanceData;
```

Exposes information about the performance of this request-response pair.

#### Inherited from

[`Response`](Response.md).[`performanceData`](Response.md#performancedata)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:206

***

### request\_seq

```ts
request_seq: number;
```

Sequence number of the request message.

#### Inherited from

[`Response`](Response.md).[`request_seq`](Response.md#request-seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:181

***

### seq

```ts
seq: number;
```

Sequence number of the message

#### Inherited from

[`Response`](Response.md).[`seq`](Response.md#seq)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:133

***

### success

```ts
success: boolean;
```

Outcome of the request.

#### Inherited from

[`Response`](Response.md).[`success`](Response.md#success)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:185

***

### type

```ts
type: "response";
```

One of "request", "response", or "event"

#### Inherited from

[`Response`](Response.md).[`type`](Response.md#type)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:177
