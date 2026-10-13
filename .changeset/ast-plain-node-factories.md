---
'@kubb/ast': minor
---

Remove `defineNode`, `NodeDef`, `nodeDefs`, the `*Def` objects and `InferSchemaNode` from `@kubb/ast`. Node factories are plain functions, `createOutput` no longer shares one `files` array between outputs, and `StatusCode` accepts any three-digit HTTP status string.
