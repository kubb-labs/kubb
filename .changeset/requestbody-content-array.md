---
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/core": minor
---

Restructure `OperationNode.requestBody` to use a typed `content` array.

The top-level `schema`, `keysToOmit`, and `contentType` fields have been removed from `requestBody`. All per-content-type data now lives in `requestBody.content`, one entry per content type declared in the spec.

**Before**

```ts
operation.requestBody?.schema
operation.requestBody?.contentType
operation.requestBody?.keysToOmit
```

**After**

```ts
operation.requestBody?.content?.[0]?.schema
operation.requestBody?.content?.[0]?.contentType
operation.requestBody?.content?.[0]?.keysToOmit
```

See `migration/requestBody-content.md` for a full migration guide.
