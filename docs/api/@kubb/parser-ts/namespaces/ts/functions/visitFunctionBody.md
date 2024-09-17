[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / visitFunctionBody

# visitFunctionBody()

## visitFunctionBody(node, visitor, context)

```ts
function visitFunctionBody(
   node, 
   visitor, 
   context): FunctionBody
```

Resumes a suspended lexical environment and visits a function body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

• **node**: [`Block`](../interfaces/Block.md)

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

[`FunctionBody`](../type-aliases/FunctionBody.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9360

## visitFunctionBody(node, visitor, context)

```ts
function visitFunctionBody(
   node, 
   visitor, 
   context): FunctionBody | undefined
```

Resumes a suspended lexical environment and visits a function body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

• **node**: `undefined` \| [`Block`](../interfaces/Block.md)

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

[`FunctionBody`](../type-aliases/FunctionBody.md) \| `undefined`

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9365

## visitFunctionBody(node, visitor, context)

```ts
function visitFunctionBody(
   node, 
   visitor, 
   context): ConciseBody
```

Resumes a suspended lexical environment and visits a concise body, ending the lexical
environment and merging hoisted declarations upon completion.

### Parameters

• **node**: [`ConciseBody`](../type-aliases/ConciseBody.md)

• **visitor**: [`Visitor`](../type-aliases/Visitor.md)\<[`Node`](../interfaces/Node.md), `undefined` \| [`Node`](../interfaces/Node.md)\>

• **context**: [`TransformationContext`](../interfaces/TransformationContext.md)

### Returns

[`ConciseBody`](../type-aliases/ConciseBody.md)

### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:9370
