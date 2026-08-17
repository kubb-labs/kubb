---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
'@kubb/core': minor
---

Support multiple content types on both request bodies and responses.

`OperationNode.requestBody` and `ResponseNode` now share the same shape: every content type declared in the spec gets its own entry in a `content` array, instead of a single root-level `schema`/`mediaType`/`contentType`. A request body or response that declares `application/json` and `multipart/form-data` produces one typed entry per content type instead of collapsing to whichever one the parser saw first.

```ts
// before
operation.requestBody?.schema
operation.requestBody?.contentType
operation.requestBody?.keysToOmit

// after
operation.requestBody?.content?.[0]?.schema
operation.requestBody?.content?.[0]?.contentType
operation.requestBody?.content?.[0]?.keysToOmit
```

The OpenAPI parser populates every content type declared for a request body or status code. A body-less response keeps a single `content` entry whose schema is the empty/`void` placeholder, and setting the adapter's `contentType` option keeps only that one content type. For convenience, `createResponse` still accepts a single `schema` (with an optional `mediaType`) and normalizes it into one `content` entry, so existing callers keep working. See `migration/requestBody-content.md` for the full migration guide.
