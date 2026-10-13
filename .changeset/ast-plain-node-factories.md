---
'@kubb/ast': patch
---

Remove `defineNode`, `NodeDef`, `nodeDefs` and the `*Def` objects from `@kubb/ast`. Node factories are plain functions, `createOutput` no longer shares one `files` array between outputs, and `StatusCode` accepts any three-digit HTTP status string.
