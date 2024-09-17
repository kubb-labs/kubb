[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / PrintHandlers

# PrintHandlers

## Methods

### hasGlobalName()?

```ts
optional hasGlobalName(name): boolean
```

A hook used by the Printer when generating unique names to avoid collisions with
globally defined names that exist outside of the current source file.

#### Parameters

• **name**: `string`

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8038

***

### isEmitNotificationEnabled()?

```ts
optional isEmitNotificationEnabled(node): boolean
```

A hook used to check if an emit notification is required for a node.

#### Parameters

• **node**: [`Node`](Node.md)

The node to emit.

#### Returns

`boolean`

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8062

***

### onEmitNode()?

```ts
optional onEmitNode(
   hint, 
   node, 
   emitCallback): void
```

A hook used by the Printer to provide notifications prior to emitting a node. A
compatible implementation **must** invoke `emitCallback` with the provided `hint` and
`node` values.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

A hint indicating the intended purpose of the node.

• **node**: [`Node`](Node.md)

The node to emit.

• **emitCallback**

A callback that, when invoked, will emit the node.

#### Returns

`void`

#### Example

```ts
var printer = createPrinter(printerOptions, {
  onEmitNode(hint, node, emitCallback) {
    // set up or track state prior to emitting the node...
    emitCallback(hint, node);
    // restore state after emitting the node...
  }
});
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8057

***

### substituteNode()?

```ts
optional substituteNode(hint, node): Node
```

A hook used by the Printer to perform just-in-time substitution of a node. This is
primarily used by node transformations that need to substitute one node for another,
such as replacing `myExportedVar` with `exports.myExportedVar`.

#### Parameters

• **hint**: [`EmitHint`](../enumerations/EmitHint.md)

A hint indicating the intended purpose of the node.

• **node**: [`Node`](Node.md)

The node to emit.

#### Returns

[`Node`](Node.md)

#### Example

```ts
var printer = createPrinter(printerOptions, {
  substituteNode(hint, node) {
    // perform substitution if necessary...
    return node;
  }
});
```

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8079
