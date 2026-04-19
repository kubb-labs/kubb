---
"@kubb/core": minor
"@kubb/adapter-oas": minor
---

Expose raw source document on adapters.

`Adapter<T>` now has a `document?` field (typed via `TDocument` generic) so adapters can expose their parsed source document.

`AdapterOas` exposes `document` directly after `parse()` is called.
