[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / isIterationStatement

# isIterationStatement()

## isIterationStatement(node, lookInLabeledStatements)

```ts
function isIterationStatement(node, lookInLabeledStatements): node is IterationStatement
```

### Parameters

• **node**: [`Node`](../interfaces/Node.md)

• **lookInLabeledStatements**: `false`

### Returns

`node is IterationStatement`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8731

## isIterationStatement(node, lookInLabeledStatements)

```ts
function isIterationStatement(node, lookInLabeledStatements): node is IterationStatement | LabeledStatement
```

### Parameters

• **node**: [`Node`](../interfaces/Node.md)

• **lookInLabeledStatements**: `boolean`

### Returns

node is IterationStatement \| LabeledStatement

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8732
