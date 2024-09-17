[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [factory](../index.md) / createIndexSignature

# createIndexSignature()

```ts
function createIndexSignature(type, __namedParameters): IndexSignatureDeclaration
```

## Parameters

• **type**: [`TypeNode`](../../ts/interfaces/TypeNode.md)

• **\_\_namedParameters** = `{}`

• **\_\_namedParameters.decorators?**: [`Decorator`](../../ts/interfaces/Decorator.md)[]

• **\_\_namedParameters.indexName?**: `string` = `'key'`

• **\_\_namedParameters.indexType?**: [`TypeNode`](../../ts/interfaces/TypeNode.md) = `...`

• **\_\_namedParameters.modifiers?**: [`Modifier`](../../ts/type-aliases/Modifier.md)[]

## Returns

[`IndexSignatureDeclaration`](../../ts/interfaces/IndexSignatureDeclaration.md)

## Defined in

[packages/parser-ts/src/factory.ts:221](https://github.com/kubb-project/kubb/blob/41d5fcbd23d143293d72542efcb650e62fa3a210/packages/parser-ts/src/factory.ts#L221)
