---
'@kubb/core': minor
'@kubb/adapter-oas': patch
---

Fold the diagnostic error helpers into the `Diagnostics` namespace: `DiagnosticError` is now `Diagnostics.Error` and the structural check is exposed as `Diagnostics.isError`.

The standalone `DiagnosticError` export from `@kubb/core` is removed. Replace `new DiagnosticError(...)` with `new Diagnostics.Error(...)`, and import `Diagnostics` instead. The thrown error keeps its `name` of `'DiagnosticError'`, so structural checks across duplicated `@kubb/core` copies still match.
