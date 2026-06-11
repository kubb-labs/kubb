---
'@kubb/adapter-oas': minor
---

Drop dead exports and lazy-load heavy deps.

Remove `mergeDocuments`, `ValidateDocumentOptions`, and `HttpMethods` from the public API (`src/index.ts`). These symbols had no consumers across the kubb, plugins, or platform repos. They remain in their source files for internal use.

Replace `@redocly/openapi-core` (8–10 MB) with `@apidevtools/json-schema-ref-parser` (~100 KB) for external `$ref` bundling. The library was already a transitive dependency and exposes the same `bundle()` behavior. `@redocly/openapi-core` is removed from `dependencies`.

Lazy-load `swagger2openapi` with a dynamic `import()` so it only loads when the input is a Swagger 2.0 document.
