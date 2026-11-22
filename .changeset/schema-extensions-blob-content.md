---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Keep a schema's vendor extensions (`x-*` keys) on its node as `extensions`, and a binary schema's `contentMediaType` and `contentEncoding` on its `blob` node as `content`.

- Adds `BlobSchemaNode`. `ScalarSchemaType` no longer includes `blob`.
