---
'@kubb/adapter-oas': patch
---

Reshape the internal parsing pipeline into three phases: `load` (read, bundle, upgrade, validate), `model` (collect schemas and operations), and `emit` (convert to the universal AST). Six overlapping `$ref` resolvers collapse into one `Refs` service, discriminator handling moves behind `preserve`/`propagate` strategies, and nothing mutates the parsed OpenAPI document in place anymore.

Generated output is unchanged, with one fix: a `requestBody` declared as a `$ref` now keeps its `description` and `required` fields when the adapter's `contentType` option is set. Previously that combination silently dropped both.
