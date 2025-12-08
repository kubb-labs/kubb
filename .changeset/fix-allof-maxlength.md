---
"@kubb/plugin-oas": patch
---

Fix `allOf` handling to properly merge constraints from inline schemas. When using `allOf` with a reference and additional constraints (e.g., `maxLength`), the constraints are now preserved during schema generation.

Changes:
- Use `flatMap` instead of `map` with `[0]` in allOf handling to preserve all parsed schemas
- Infer type from constraints when no explicit type is provided (e.g., `maxLength` infers `string` type)
- Include baseItems (constraints) when returning empty type fallback
