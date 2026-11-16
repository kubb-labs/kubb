---
'@kubb/adapter-oas': minor
---

`type: string, format: byte` is now a `string` instead of a `Blob`. OpenAPI defines `byte` as base64-encoded text, and `contentEncoding: base64` already gave a `string`. Generated types change: fields that were `Blob` are now `string`, and `plugin-zod` now emits `z.base64()` for them.
