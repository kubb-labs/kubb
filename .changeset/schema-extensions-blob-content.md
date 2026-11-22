---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/kit': patch
'@kubb/core': patch
---

Keep vendor extensions (`x-*` keys) as `extensions` on schema, parameter, request body, response and content nodes, and a binary schema's `contentMediaType` and `contentEncoding` on its `blob` node as `content`.

- Adds `BlobSchemaNode` for `blob` nodes. `ScalarSchemaType` still includes `blob`, but `ScalarSchemaNode` no longer does: type a blob node as `BlobSchemaNode` instead.
