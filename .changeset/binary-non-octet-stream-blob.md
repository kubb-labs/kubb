---
'@kubb/adapter-oas': patch
---

Keep a binary response or request body typed as a blob for any non-JSON media type (`application/pdf`, `image/png`, ...), not just `application/octet-stream`. A newer `@scalar/openapi-upgrader` release started emptying `format: 'binary'` schemas for every media type on the OAS 3.1 upgrade, not just `application/octet-stream`, so those bodies fell back to `emptySchemaType` instead of resolving to a blob.
