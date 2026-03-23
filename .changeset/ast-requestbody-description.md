---
"@kubb/ast": patch
"@kubb/adapter-oas": patch
"@kubb/plugin-ts": patch
---

Fix missing `@description` on request body type aliases.

The OAS `requestBody.description` field (top-level on the request body object, distinct from the schema's own description) was silently dropped. It is now:

- Added as `description?: string` to `OperationNode.requestBody` in `@kubb/ast`
- Populated by `@kubb/adapter-oas` parser from `operation.schema.requestBody.description`
- Used by `@kubb/plugin-ts` typeGenerator: `requestBody.description` takes precedence, falling back to `requestBody.schema.description`
