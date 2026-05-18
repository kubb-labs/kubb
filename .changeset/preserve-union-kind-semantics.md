---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Add optional `strategy?: 'one' | 'any'` field to `UnionSchemaNode` to preserve `oneOf` vs `anyOf` semantics from the original OpenAPI schema. The adapter sets this field during parsing so plugins can implement appropriate validation logic.
