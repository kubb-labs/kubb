---
"@kubb/oas": patch
"@kubb/plugin-oas": patch
---

Fix `$ref` resolution in `Oas.getSchemas()` to prevent self-referential `z.lazy()` output when the bundler deduplicates schemas referenced from multiple external files.
The resolution logic is moved from `SchemaGenerator` into `Oas` where it belongs.
