---
'@kubb/kit': patch
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

`@kubb/kit` now exports the `Diagnostic` type. `@kubb/ast` exports `collectSchemaRefs`, the set of schema names a node references. `@kubb/adapter-oas` depends on `@kubb/kit` only, with no change to generated output.
