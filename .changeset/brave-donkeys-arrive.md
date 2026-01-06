---
"@kubb/plugin-ts": patch
---

Fix TypeScript printer crash by validating AST nodes and filtering out invalid nodes

- Add null/undefined filtering in factory functions (createUnionDeclaration, createIntersectionDeclaration, createArrayDeclaration, createTupleDeclaration)
- Add fallback to 'unknown' type when parser produces no valid type for a property
- Add safePrint wrapper with validation to detect and throw errors for Unknown SyntaxKind nodes instead of silently failing
- Fixes issue where builds would succeed despite TypeScript printer crashes when processing certain OpenAPI specs (e.g., Jira public spec)
