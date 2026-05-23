---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Add multiple response content type support to the AST and OpenAPI parser.

`ResponseNode` now carries a `content` array (mirroring `requestBody.content`) with one entry per content type declared for a status code. The OpenAPI parser populates every content type instead of keeping only the first. The legacy `schema` and `mediaType` fields stay populated with the primary (JSON-preferred) entry for backward compatibility, so existing consumers are unaffected. When the adapter `contentType` option is set, only that content type is kept.
