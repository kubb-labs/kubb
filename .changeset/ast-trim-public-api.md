---
'@kubb/ast': major
---

Trim the `@kubb/ast` public API to shrink the maintained surface.

Removed exports that were unused across both the core monorepo and the plugins, and that duplicated or backed a public counterpart:

Deleted (dead code): the `nodeKinds` and `mediaTypes` constants (no references anywhere), the `RefMap` type, and the `InferSchema` type alias (use `InferSchemaNode`).

Also deleted: the `dispatch` helper and its `DispatchRule` type. The OAS adapter was the only consumer and now keeps its own local rule table and loop, so the generic helper is no longer part of the public API.

No longer exported (now internal):

- `collectLazy`, use the eager `collect`
- `createContent` / `createRequestBody`, content is normalized for you by `createResponse` / `createOperation`
- `mergeAdjacentObjects`, use `mergeAdjacentObjectsLazy` (`[...mergeAdjacentObjectsLazy(members)]`)
- `isSchemaEqual`, compare `signatureOf(a) === signatureOf(b)`
- `isScalarPrimitive`, `resolveRefName`, `collectReferencedSchemaNames`, `isInputNode`, `isOutputNode`

The README's `Refs` example also referenced helpers that never existed (`buildRefMap`, `resolveRef`). It now documents the real `extractRefName`.
