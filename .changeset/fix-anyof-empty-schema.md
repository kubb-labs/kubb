---
'@kubb/plugin-oas': patch
---

Fix handling of empty schema objects in anyOf/oneOf/allOf. Empty schema objects `{}` in anyOf, oneOf, or allOf are now correctly preserved in unions and intersections instead of being filtered out. Per JSON Schema specification, an empty schema `{}` accepts any value and should be represented as the configured unknownType (default: 'any' or 'unknown'). This ensures that schemas like `anyOf: [{}, {type: "null"}]` correctly generate `unknown | null` instead of just `null`.
