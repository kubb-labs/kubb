---
'@kubb/parser-md': patch
---

Depend on `@kubb/kit` instead of `@kubb/ast` and `@kubb/core` directly.

`parserMd` only ever needed `defineParser` and the `ast` namespace (for `extractStringsFromNodes` and the `CodeNode` type), both already reachable through `@kubb/kit`. No behavior change.
