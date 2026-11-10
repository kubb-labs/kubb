---
'@kubb/adapter-oas': patch
---

Keep `if`/`then`/`else`, `dependentRequired` and `dependentSchemas` on a component schema that is a `$ref` with sibling keywords. Its `conditionals` now hold its own entries next to the ones from the target.
