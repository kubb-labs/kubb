---
'@kubb/kit': patch
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

`@kubb/kit`: `syncSchemaRef` reuses `ast.mergeRefWithSchema`, `containsCircularRef` reads the memoized `ast.collectSchemaRefs` set, the internal barrels are gone and the `Diagnostic` type is exported; no behavior change.
`@kubb/ast`: export `collectSchemaRefs`, the memoized per-node set of referenced schema names.
`@kubb/adapter-oas`: depend on `@kubb/kit` only instead of also on `@kubb/ast` and `@kubb/core`; no output change.
