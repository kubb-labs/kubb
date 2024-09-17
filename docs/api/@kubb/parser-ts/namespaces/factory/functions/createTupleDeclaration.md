[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createTupleDeclaration

# createTupleDeclaration()

```ts
function createTupleDeclaration(__namedParameters): ts.TypeNode | null
```

Minimum nodes length of 2

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.nodes**: `TypeNode`[]

• **\_\_namedParameters.withParentheses?**: `boolean`

## Returns

`ts.TypeNode` \| `null`

## Example

```ts
`string & number`
```

## Defined in

[packages/parser-ts/src/factory.ts:71](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/parser-ts/src/factory.ts#L71)
