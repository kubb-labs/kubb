[API](../../../../../../../packages.md) / [@kubb/parser-ts](../../../../../index.md) / [ts](../../../index.md) / [server](../index.md) / Session

# Session\<TMessage\>

## Type Parameters

• **TMessage** = `string`

## Implements

- [`EventSender`](../interfaces/EventSender.md)

## Constructors

### new Session()

```ts
new Session<TMessage>(opts): Session<TMessage>
```

#### Parameters

• **opts**: [`SessionOptions`](../interfaces/SessionOptions.md)

#### Returns

[`Session`](Session.md)\<`TMessage`\>

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3431

## Properties

### byteLength()

```ts
protected byteLength: (buf, encoding?) => number;
```

#### Parameters

• **buf**: `string`

• **encoding?**: [`BufferEncoding`](../../../type-aliases/BufferEncoding.md)

#### Returns

`number`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3424

***

### canUseEvents

```ts
protected canUseEvents: boolean;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3427

***

### host

```ts
protected host: ServerHost;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3421

***

### logger

```ts
protected logger: Logger;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3426

***

### projectService

```ts
protected projectService: ProjectService;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3416

***

### typingsInstaller

```ts
protected readonly typingsInstaller: ITypingsInstaller;
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3423

## Methods

### addProtocolHandler()

```ts
addProtocolHandler(command, handler): void
```

#### Parameters

• **command**: `string`

• **handler**

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3572

***

### event()

```ts
event<T>(body, eventName): void
```

#### Type Parameters

• **T** *extends* `object`

#### Parameters

• **body**: `T`

• **eventName**: `string`

#### Returns

`void`

#### Implementation of

`EventSender.event`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3442

***

### executeCommand()

```ts
executeCommand(request): HandlerResponse
```

#### Parameters

• **request**: [`Request`](../namespaces/protocol/interfaces/Request.md)

#### Returns

[`HandlerResponse`](../interfaces/HandlerResponse.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3576

***

### executeWithRequestId()

```ts
executeWithRequestId<T>(requestId, f): T
```

#### Type Parameters

• **T**

#### Parameters

• **requestId**: `number`

• **f**

#### Returns

`T`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3575

***

### exit()

```ts
exit(): void
```

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3568

***

### getCanonicalFileName()

```ts
getCanonicalFileName(fileName): string
```

#### Parameters

• **fileName**: `string`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3567

***

### logError()

```ts
logError(err, cmd): void
```

#### Parameters

• **err**: `Error`

• **cmd**: `string`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3438

***

### onMessage()

```ts
onMessage(message): void
```

#### Parameters

• **message**: `TMessage`

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3577

***

### parseMessage()

```ts
protected parseMessage(message): Request
```

#### Parameters

• **message**: `TMessage`

#### Returns

[`Request`](../namespaces/protocol/interfaces/Request.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3578

***

### send()

```ts
send(msg): void
```

#### Parameters

• **msg**: [`Message`](../namespaces/protocol/interfaces/Message.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3440

***

### toStringMessage()

```ts
protected toStringMessage(message): string
```

#### Parameters

• **message**: `TMessage`

#### Returns

`string`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3579

***

### writeMessage()

```ts
protected writeMessage(msg): void
```

#### Parameters

• **msg**: [`Message`](../namespaces/protocol/interfaces/Message.md)

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:3441
