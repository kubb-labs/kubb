---
'@kubb/ast': minor
---

Add schema-graph helpers to `@kubb/ast`: `resolveRefName`, `collectReferencedSchemaNames`, `findCircularSchemas`, and `containsCircularRef`. These replace per-plugin reimplementations of reference traversal and cycle detection.
