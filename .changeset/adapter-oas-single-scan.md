---
'@kubb/adapter-oas': patch
---

Read a spec faster before parsing: one walk now checks for external refs, `$id` and `$anchor` targets, and Swagger 2.0 path refs, and builds JSON pointers only when a spec has an `$id` or `$anchor`. On large specs the adapter parses about 0.2 s sooner.
