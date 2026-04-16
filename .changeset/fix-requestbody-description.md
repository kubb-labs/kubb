---
"@kubb/ast": patch
"@kubb/adapter-oas": patch
---

Fix missing `@description` on request body type aliases.

The OAS `requestBody.description` field was silently dropped. It is now added as `description?: string` to `OperationNode.requestBody` and populated from the OpenAPI spec.
