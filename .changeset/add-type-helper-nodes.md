---
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/core": patch
---

Add AST helpers: `UrlSchemaNode` with Express-style `path`, `applyParamsCasing`, and `never` to `PrimitiveSchemaType`. Add `unknownType` and `emptySchemaType` options to `convertSchema`. `OverrideItem.options` is now `Omit<Partial<TOptions>, 'override'>`.
