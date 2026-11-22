---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Keep vendor extensions (`x-*` keys) as `extensions` on schema, parameter, request body, response and content nodes, and a binary schema's `contentMediaType` and `contentEncoding` on its `blob` node as `content`.

- Adds `BlobSchemaNode`. `ScalarSchemaType` no longer includes `blob`.
