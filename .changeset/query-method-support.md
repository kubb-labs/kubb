---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Parse OpenAPI 3.2 `query` operations (the HTTP QUERY method, RFC 10008) instead of dropping them. They become operation nodes with method `QUERY`, so plugins generate types and clients for them, and `HttpMethod` includes `'QUERY'`.
