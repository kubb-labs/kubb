---
"@kubb/plugin-oas": patch
---

Fixed self-referential circular type references when OpenAPI schemas use `allOf` to extend a discriminator parent that has `oneOf`/`anyOf` referencing the children.

When a child schema extends a discriminator parent via `allOf` and the parent's `oneOf`/`anyOf` references the child, the generated TypeScript types would have circular references. This fix detects this pattern and skips adding redundant discriminator constraints to avoid the circular structure.
