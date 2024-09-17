[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getJSDocParameterTags

# getJSDocParameterTags()

```ts
function getJSDocParameterTags(param): readonly JSDocParameterTag[]
```

Gets the JSDoc parameter tags for the node if present.

## Parameters

• **param**: [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

## Returns

readonly [`JSDocParameterTag`](../interfaces/JSDocParameterTag.md)[]

## Remarks

Returns any JSDoc param tag whose name matches the provided
parameter, whether a param tag on a containing function
expression, or a param tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are returned first, so in the previous example, the param
tag on the containing function expression would be first.

For binding patterns, parameter tags are matched by position.

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8579
