---
'@kubb/ast': minor
'@kubb/parser-ts': minor
---

Add the expression and type intermediate representations so the Kubb AST can describe generated values and types directly, instead of leaning on hand-built strings and the TypeScript compiler factory inside each plugin.

`@kubb/ast` gains an expression IR (`createIdentifier`, `createLiteral`, `createMember`, `createCall`, `createObject`, `createArray`, `createArrow`, `createSpread`, `createAs`, `createRaw`) for schema values such as `z.object({ … })`, and a type IR (`createTypeKeyword`, `createTypeReference`, `createTypeArray`, `createTypeUnion`, `createTypeIntersection`, `createTypeTuple`, `createTypeObject`, `createTypeOmit`, `createTypeUrlTemplate`, `createTypeLiteralType`) for TypeScript types. Both are plain, language-agnostic data nodes with no dependency on `typescript`.

`@kubb/parser-ts` serializes them: `printExpression` renders the expression IR to source, reusing the existing `buildObject`/`buildList`/`objectKey` formatters, and `typeIRToNode` converts the type IR to TypeScript compiler nodes for `parserTs.print`. Output stays byte-identical to the current printers, and all TypeScript-syntax knowledge now lives in the parser, so a parser for another language can serialize the same IR.

This is additive: the existing printer layer keeps working unchanged.
