---
"@kubb/oas": patch
"@kubb/plugin-oas": patch
---

fix: remove redocly and use @apidevtools/json-schema-ref-parser for OpenAPI bundling and dereferencing

Replaced `@redocly/openapi-core` with `@apidevtools/json-schema-ref-parser` to resolve `MissingPointerError` issues with `$ref` pointers. External file refs and URL refs are now properly resolved.
