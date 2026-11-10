---
'@kubb/ast': minor
'@kubb/core': minor
---

The AST visitors now walk the schemas inside `conditionals`, `contains` and a string's `content`, so `transform`, `collect`, `findCircularSchemas` and `collectUsedSchemaNames` see them. A cycle through `if`/`then` or `contains` is now detected, and an `include` filter keeps a schema that only these fields reference.

Imports stay as they are: `resolver.imports` and `collectImportedRefNames` leave out refs in these fields unless you pass `checks: true`. A plugin that prints these checks needs it.
