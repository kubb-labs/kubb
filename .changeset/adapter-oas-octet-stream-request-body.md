---
'@kubb/adapter-oas': patch
---

Keep generating a request body schema for `application/octet-stream` bodies.

The 3.0 -> 3.1 upgrade drops the schema from an `application/octet-stream` request body, leaving an empty media type object. `getRequestSchema` now recognizes a binary media type and synthesizes the `{ type: 'string', contentMediaType: 'application/octet-stream' }` schema, so operations like `uploadFile` still emit a binary request body type (for example the Zod `uploadFileDataSchema`).
