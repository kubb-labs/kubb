---
'@kubb/kit': patch
---

A `schemaName` entry in `include` also generates every schema the matched schemas reference, directly or through other schemas, so the generated imports resolve. Add a schema to `exclude` to leave it out.
