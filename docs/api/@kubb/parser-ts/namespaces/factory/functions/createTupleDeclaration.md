[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createTupleDeclaration

# createTupleDeclaration()

```ts
function createTupleDeclaration(__namedParameters): TypeNode | null
```

Minimum nodes length of 2

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.nodes**: [`TypeNode`](../../ts/interfaces/TypeNode.md)[]

• **\_\_namedParameters.withParentheses?**: `boolean`

## Returns

[`TypeNode`](../../ts/interfaces/TypeNode.md) \| `null`

## Example

```ts
`string & number`
```

## Defined in

[packages/parser-ts/src/factory.ts:71](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/parser-ts/src/factory.ts#L71)
