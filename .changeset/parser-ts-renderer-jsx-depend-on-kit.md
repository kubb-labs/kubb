---
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
---

Depend on `@kubb/kit` instead of `@kubb/ast` and `@kubb/core` directly.

Both packages only ever used `defineParser` and AST node types, all reachable through `@kubb/kit`'s existing re-export surface, so no new kit exports were needed. No behavior change.
