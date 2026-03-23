---
"@kubb/adapter-oas": patch
---

Discriminant values are now embedded into each union member when a discriminator mapping is present.

Previously, a discriminated `oneOf`/`anyOf` union without sibling `properties` would emit a plain union (`Cat | Dog`). Now each mapped member is intersected with its narrowed discriminant literal value, producing `(Cat & { type: 'cat' }) | (Dog & { type: 'dog' })`.

Child schemas that extend a discriminated parent via `allOf` now also carry the narrowed discriminant literal in their intersection type, even when the parent `$ref` is filtered to prevent circular type references.
