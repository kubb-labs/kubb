---
"@kubb/oas": patch
---

fix: merge external file component schemas before bundling to restore separate schema generation

When a main OpenAPI spec references external files (e.g. `api-definitions.yml#/components/requestBodies/...`), the bundler was inlining all external schemas rather than lifting them into `#/components/schemas/`. This caused plugins like `plugin-zod` to generate all schemas inline—no separate `parcelSchema.ts`, no `contactDetailsTypeSchema.ts`, etc.

A pre-bundling step now scans the main spec for external local-file references, merges their `components/` sections into the main document, and replaces external file refs with internal refs before passing to the bundler. This ensures `getSchemas()` returns all component schemas and separate schema files are generated as expected.
