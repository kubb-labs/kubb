---
'@kubb/kit': patch
---

A `schemaName` entry in `include` also generates the schemas its matches reference, directly or indirectly, so the generated imports resolve. An `exclude` entry still removes them.
