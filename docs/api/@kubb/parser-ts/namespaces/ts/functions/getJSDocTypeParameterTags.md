[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getJSDocTypeParameterTags

# getJSDocTypeParameterTags()

```ts
function getJSDocTypeParameterTags(param): readonly JSDocTemplateTag[]
```

Gets the JSDoc type parameter tags for the node if present.

## Parameters

• **param**: [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Returns

readonly [`JSDocTemplateTag`](../interfaces/JSDocTemplateTag.md)[]

## Remarks

Returns any JSDoc template tag whose names match the provided
parameter, whether a template tag on a containing function
expression, or a template tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are returned first, so in the previous example, the template
tag on the containing function expression would be first.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8590
