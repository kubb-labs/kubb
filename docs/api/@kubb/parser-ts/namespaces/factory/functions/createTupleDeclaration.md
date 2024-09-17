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

[packages/parser-ts/src/factory.ts:71](https://github.com/kubb-project/kubb/blob/ff80665146ae086e044807d0072fda660e72e1fd/packages/parser-ts/src/factory.ts#L71)
