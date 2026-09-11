---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

A `oneOf`/`anyOf` without a declared OpenAPI `discriminator` now infers one when a property
carries a distinct single literal value on every branch. `UnionSchemaNode.discriminatorPropertyName`
is set from that inference, so every printer that narrows on it (`plugin-zod`, `plugin-faker`)
picks it up without reimplementing the same scan.
