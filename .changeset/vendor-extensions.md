---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Carry vendor extensions on the AST. `OperationNode` and `InputMeta` gain an optional `extensions` bag with every `x-*` key copied as-is, set only when the source has one. The OAS adapter fills it from the operation object and the document root, so plugins can read keys like `x-org-ignore` without walking the raw document. Path-level extensions are not copied.
