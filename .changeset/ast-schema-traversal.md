---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Add direct child and schema traversal helpers, early schema lookup, and ref resolution to the AST package.

- Expose `forEachChild`, `forEachSchema`, `findSchema`, and `resolveRef`.
- Keep OpenAPI `propertyNames` schemas on typed object nodes.
