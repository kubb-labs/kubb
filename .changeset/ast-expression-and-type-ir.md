---
'@kubb/ast': minor
'@kubb/parser-ts': minor
---

Add an expression IR and a type IR so the Kubb AST can describe generated values and types on its own, instead of building strings by hand and calling the TypeScript compiler factory in each plugin.

`@kubb/ast` gets the expression IR (`createIdentifier`, `createLiteral`, `createMember`, `createCall`, `createObject`, `createArray`, `createArrow`, `createSpread`, `createAs`, `createRaw`) for schema values like `z.object({ … })`, and the type IR (`createTypeKeyword`, `createTypeReference`, `createTypeArray`, `createTypeUnion`, `createTypeIntersection`, `createTypeTuple`, `createTypeObject`, `createTypeOmit`, `createTypeUrlTemplate`, `createTypeLiteralType`) for TypeScript types. The nodes are plain data and do not import `typescript`.

`@kubb/parser-ts` turns them into source. `printExpression` renders the expression IR with the existing `buildObject`, `buildList`, and `objectKey` formatters, and `typeIRToNode` converts the type IR to TypeScript compiler nodes for `parserTs.print`. The output matches the current printers byte for byte, and the TypeScript syntax now lives in the parser, so a parser for another language can render the same IR.

The change is additive. The existing printer layer keeps working.
