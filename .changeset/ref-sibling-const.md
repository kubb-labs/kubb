---
"@kubb/adapter-oas": patch
---

A `const` next to a `$ref` (OpenAPI 3.1) is no longer dropped. The property narrows to the literal, so a `z.discriminatedUnion` over members that pin the discriminator to different values no longer throws `Duplicate discriminator value`.
