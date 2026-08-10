---
'@kubb/adapter-oas': patch
---

Default `unknownType` and `emptySchemaType` to `'unknown'` instead of `'any'`.

Schemas the parser can't pin down a type for now generate `unknown` by default instead of `any`: `additionalProperties: {}`, `patternProperties` with an empty or `true` value, a tuple's open tail (`items: true` or absent), a completely empty schema (`{}`), and a `not` schema. This matches what the `unknownType: 'unknown'` override already did for users who set it, and keeps generated output clean under `no-explicit-any` lint rules without any config. Pass `unknownType: 'any'` (and/or `emptySchemaType: 'any'`) to restore the previous behavior.
