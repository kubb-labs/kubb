[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createParameterSignature

# createParameterSignature()

```ts
function createParameterSignature(name, __namedParameters): ParameterDeclaration
```

## Parameters

• **name**: `string` \| [`BindingName`](../../ts/type-aliases/BindingName.md)

• **\_\_namedParameters**

• **\_\_namedParameters.decorators?**: [`Decorator`](../../ts/interfaces/Decorator.md)[]

• **\_\_namedParameters.dotDotDotToken?**: [`DotDotDotToken`](../../ts/type-aliases/DotDotDotToken.md)

• **\_\_namedParameters.initializer?**: [`Expression`](../../ts/interfaces/Expression.md)

• **\_\_namedParameters.modifiers?**: [`Modifier`](../../ts/type-aliases/Modifier.md)[]

• **\_\_namedParameters.questionToken?**: `boolean` \| [`QuestionToken`](../../ts/type-aliases/QuestionToken.md)

• **\_\_namedParameters.type?**: [`TypeNode`](../../ts/interfaces/TypeNode.md)

## Returns

[`ParameterDeclaration`](../../ts/interfaces/ParameterDeclaration.md)

## Defined in

[packages/parser-ts/src/factory.ts:160](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/parser-ts/src/factory.ts#L160)
