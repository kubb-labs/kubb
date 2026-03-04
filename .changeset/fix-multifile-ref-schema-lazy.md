---
"@kubb/plugin-oas": patch
---

Fix self-referential `z.lazy()` output for multi-file OpenAPI specs. When `@readme/openapi-parser` bundles multi-file specs, schemas in `components.schemas` could be represented as `$ref` objects. `SchemaGenerator#doBuild` now resolves those `$ref` entries before calling `parse()`, preventing output like `export const parcelSchema = z.lazy(() => parcelSchema)`.
