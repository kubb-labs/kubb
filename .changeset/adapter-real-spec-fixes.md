---
'@kubb/adapter-oas': patch
---

Fix three schemas found in real OpenAPI documents. An `allOf` member that points at an alias, a schema that is only a `$ref`, now gives its properties to a `required`-only sibling, where they were typed `unknown`. A discriminator member whose property is the nullable enum `anyOf: [{ enum }, { type: 'null' }]` keeps its own value, where it got the schema name. A boolean schema (`true` or `false`) is read as any value or as `never`, where it stopped the run with `Cannot use 'in' operator`.
