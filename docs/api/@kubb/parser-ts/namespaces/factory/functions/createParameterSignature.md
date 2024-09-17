[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createParameterSignature

# createParameterSignature()

```ts
function createParameterSignature(name, __namedParameters): ts.ParameterDeclaration
```

## Parameters

• **name**: `string` \| `BindingName`

• **\_\_namedParameters**

• **\_\_namedParameters.decorators?**: `Decorator`[]

• **\_\_namedParameters.dotDotDotToken?**: `DotDotDotToken`

• **\_\_namedParameters.initializer?**: `Expression`

• **\_\_namedParameters.modifiers?**: `Modifier`[]

• **\_\_namedParameters.questionToken?**: `boolean` \| `QuestionToken`

• **\_\_namedParameters.type?**: `TypeNode`

## Returns

`ts.ParameterDeclaration`

## Defined in

[packages/parser-ts/src/factory.ts:160](https://github.com/kubb-project/kubb/blob/7f30045af96d8c89b6cda0a30f7535f095a0cb45/packages/parser-ts/src/factory.ts#L160)
