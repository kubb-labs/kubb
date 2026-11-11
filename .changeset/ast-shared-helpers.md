---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Add `ast.mediaType`, `ast.server`, `ast.auth` and `ast.http` helpers, so plugins can read media types, status codes, the primary success response, servers and auth requirements without their own copies.

`@kubb/adapter-oas` now uses `ast.mediaType` to detect stream media types, so any `application/*+json-seq` type is read as a stream, not only `application/geo+json-seq`. `multipart/mixed` is no longer read as a stream, since no plugin supports it.
