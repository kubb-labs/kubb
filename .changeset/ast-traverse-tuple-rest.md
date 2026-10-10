---
'@kubb/ast': patch
---

Visit schemas inside a tuple's `rest` and inside `patternProperties`, so refs there are collected, transformed by macros, and imported in generated files.

- `transform`, `collect` and `collectImportedRefNames` now reach `rest` and `patternProperties` on a `SchemaNode`.
- `createInput()` gives every node its own `schemas`, `operations` and `meta` objects instead of sharing one default.
