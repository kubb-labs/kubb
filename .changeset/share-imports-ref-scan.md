---
'@kubb/ast': minor
'@kubb/core': patch
---

Walk a schema's `$ref` subtree once and share it across plugins.

`resolver.imports` scanned a node's whole subtree for `$ref`s on every call, so the ts, zod, and faker plugins each re-walked the same schema and operation. The scan now runs through a new `collectImportedRefNames` helper in `@kubb/ast` that memoizes the ordered ref set by node identity, so a schema shared across plugins is walked once and every plugin's resolver reads the same result.

Import output is unchanged. Only refs carrying a `$ref` pointer are counted, in first-occurrence order and de-duplicated. `collectImportedRefNames` is the ordered, import-facing counterpart to `collectReferencedSchemaNames`, which stays the unordered set used for graph analysis.
