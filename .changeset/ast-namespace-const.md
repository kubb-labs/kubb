---
'@kubb/core': minor
---

Expose an `ast` namespace const from `@kubb/core` that re-exports every runtime helper from `@kubb/ast`. Community plugins can now import `{ ast }` from `@kubb/core` instead of depending on `@kubb/ast` directly. All AST types are also re-exported from `@kubb/core`.
