---
"@kubb/adapter-oas": patch
---

Make the per-schema converter functions in `converters.ts` module-private. They were exported but only consumed inside the file through the `schemaRules` table, so nothing outside the module could see them anyway.
