---
"@kubb/oas": minor
---

Replace `@redocly/openapi-core`, `oas-normalize`, `swagger2openapi`, and `@stoplight/yaml` with `@scalar/openapi-parser` and `@scalar/json-magic`.

- External `$ref`s (file paths and URLs) are now bundled via `@scalar/json-magic`'s `bundle()` with `readFiles()` and `fetchUrls()` plugins
- Swagger 2.0 → OpenAPI 3.x conversion now uses `upgrade()` from `@scalar/openapi-parser`
- Validation now uses `validate()` from `@scalar/openapi-parser`
- `$ref` strings are preserved in the loaded document so that `dereferenceWithRef()` and cross-schema imports continue to work
