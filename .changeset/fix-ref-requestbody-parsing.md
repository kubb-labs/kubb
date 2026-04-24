---
"@kubb/adapter-oas": patch
---

Fix `$ref` requestBody not being parsed in `getRequestBodyContentTypes` and `getRequestBodyMeta`.

`dereferenceWithRef` intentionally keeps `$ref` on the merged object for provenance tracking,
but the subsequent `isReference` guards treated the fully-resolved object as an unresolved
reference and returned early. Operations whose `requestBody` was a `$ref` therefore produced
`requestBody: undefined`, and downstream plugins emitted `data?: never` instead of the
expected typed parameter.

Both guards are removed; only a `!body` check (missing body) remains.
