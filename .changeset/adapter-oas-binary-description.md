---
'@kubb/adapter-oas': patch
---

Type a `format: binary` body as a blob when its schema also has a `description`, `title`, `example`, or another annotation. The OpenAPI 3.1 upgrade drops `format: binary` and leaves the annotation, so the body became `unknown`. The annotation is kept on the blob schema.
