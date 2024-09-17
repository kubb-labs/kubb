[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / TransformationResult

# TransformationResult\<T\>

## Type Parameters

• **T** *extends* [`Node`](Node.md)

## Properties

### diagnostics?

```ts
optional diagnostics: DiagnosticWithLocation[];
```

Gets diagnostics for the transformation.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7933

***

### transformed

```ts
transformed: T[];
```

Gets the transformed source files.

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7931

## Methods

### dispose()

```ts
dispose(): void
```

Clean up EmitNode entries on any parse-tree nodes.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7958

***

### emitNodeWithNotification()

```ts
emitNodeWithNotification(
   hint, 
   node, 
   emitCallback): void
```

Emits a node with possible notification.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

A hint as to the intended usage of the node.

• **node**: [`Node`](Node.md)

The node to emit.

• **emitCallback**

A callback used to emit the node.

#### Returns

`void`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7948

***

### isEmitNotificationEnabled()?

```ts
optional isEmitNotificationEnabled(node): boolean
```

Indicates if a given node needs an emit notification

#### Parameters

• **node**: [`Node`](Node.md)

The node to emit.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7954

***

### substituteNode()

```ts
substituteNode(hint, node): Node
```

Gets a substitute for a node, if one is available; otherwise, returns the original node.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

A hint as to the intended usage of the node.

• **node**: [`Node`](Node.md)

The node to substitute.

#### Returns

[`Node`](Node.md)

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7940
