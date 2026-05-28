---
'@kubb/ast': major
---

Trim the `@kubb/ast` public API to shrink the maintained surface.

Removed exports that were unused across both the core monorepo and the plugins, and that duplicated or backed a public counterpart:

- **Deleted (dead code):** `nodeKinds` and `mediaTypes` constants (no references anywhere), the `RefMap` type, and the `InferSchema` type alias (use `InferSchemaNode`).
- **No longer exported (now internal):** `collectLazy` (use the eager `collect`), and the `createContent` / `createRequestBody` builders (content is normalized for you by `createResponse` / `createOperation`).

The README's `Refs` example also referenced helpers that never existed (`buildRefMap`, `resolveRef`); it now documents the real `extractRefName`.
