[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / hasJSDocParameterTags

# hasJSDocParameterTags()

```ts
function hasJSDocParameterTags(node): boolean
```

Return true if the node has JSDoc parameter tags.

## Parameters

• **node**: 
  \| [`IndexSignatureDeclaration`](../interfaces/IndexSignatureDeclaration.md)
  \| [`MethodDeclaration`](../interfaces/MethodDeclaration.md)
  \| [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md)
  \| [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md)
  \| [`CallSignatureDeclaration`](../interfaces/CallSignatureDeclaration.md)
  \| [`ConstructSignatureDeclaration`](../interfaces/ConstructSignatureDeclaration.md)
  \| [`MethodSignature`](../interfaces/MethodSignature.md)
  \| [`FunctionTypeNode`](../interfaces/FunctionTypeNode.md)
  \| [`ConstructorTypeNode`](../interfaces/ConstructorTypeNode.md)
  \| [`JSDocFunctionType`](../interfaces/JSDocFunctionType.md)
  \| [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)
  \| [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md)
  \| [`FunctionExpression`](../interfaces/FunctionExpression.md)
  \| [`ArrowFunction`](../interfaces/ArrowFunction.md)

## Returns

`boolean`

## Remarks

Includes parameter tags that are not directly on the node,
for example on a variable declaration whose initializer is a function expression.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8597
