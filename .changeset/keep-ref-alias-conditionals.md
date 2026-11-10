---
'@kubb/adapter-oas': patch
---

Apply the keywords next to a component schema's `$ref` together with its target. Such a schema used to become a plain copy of the target, so its own `description`, `required`, `properties`, `if`/`then`/`else`, `dependentRequired` and `dependentSchemas` were dropped. An `allOf` next to the `$ref` keeps its members, and an `allOf` member's `conditionals` are no longer replaced by the ones of the schema around it.
