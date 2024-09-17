[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createPropertySignature

# createPropertySignature()

```ts
function createPropertySignature(__namedParameters): PropertySignature
```

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.modifiers?**: [`Modifier`](../../ts/type-aliases/Modifier.md)[] = `[]`

• **\_\_namedParameters.name**: `string` \| [`PropertyName`](../../ts/type-aliases/PropertyName.md)

• **\_\_namedParameters.questionToken?**: `boolean` \| [`QuestionToken`](../../ts/type-aliases/QuestionToken.md)

• **\_\_namedParameters.readOnly?**: `boolean`

• **\_\_namedParameters.type?**: [`TypeNode`](../../ts/interfaces/TypeNode.md)

## Returns

[`PropertySignature`](../../ts/interfaces/PropertySignature.md)

## Defined in

[packages/parser-ts/src/factory.ts:139](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/parser-ts/src/factory.ts#L139)
