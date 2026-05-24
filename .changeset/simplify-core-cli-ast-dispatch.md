---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/cli': patch
---

Reduce internal complexity in the AST, core, and CLI packages to make them easier to work with and debug. No public API or generated output changes.

- `@kubb/ast`: `walk`, `transform`, and `collectLazy` now share a single node-kind dispatch helper instead of three duplicated `switch` statements, and `combineExports`/`combineImports` share a name-merge helper.
- `@kubb/core`: the schema and operation generator passes in `KubbDriver` are unified into one dispatch function.
- `@kubb/cli`: the clack, GitHub Actions, and plain loggers share progress-counter and hook-timing helpers.
