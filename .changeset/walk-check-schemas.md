---
'@kubb/ast': patch
'@kubb/core': patch
---

Cycle detection, `include` filtering and imports now see the schemas inside `conditionals`, `contains` and a string's `content`. `findCircularSchemas` and `collectUsedSchemaNames` follow refs in these fields, so a cycle through them is detected and an `include` filter keeps a schema only they reference. `resolver.imports` and `collectImportedRefNames` add those refs only with `checks: true`, which a plugin that prints these checks passes. `transform` and `collect` still skip these fields.
