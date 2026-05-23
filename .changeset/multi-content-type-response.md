---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
---

Add multiple response content type support to the AST and OpenAPI parser.

`ResponseNode` now mirrors `requestBody`: the response body schemas live exclusively inside a
`content` array (one entry per content type), instead of a single root-level `schema`/`mediaType`.
This removes the duplicated schema that previously sat both on the node root and inside `content`.
The OpenAPI parser populates every content type declared for a status code; body-less responses
keep a single `content` entry whose schema is the empty/`void` placeholder. When the adapter
`contentType` option is set, only that content type is kept.

For convenience `createResponse` still accepts a single `schema` (with optional `mediaType`),
normalizing it into one `content` entry, so existing callers keep working.
