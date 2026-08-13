---
'@kubb/adapter-oas': patch
---

Load the OpenAPI validator only when validation runs.

`@readme/openapi-parser` is used by `validateDocument` alone, but it was imported at the top of the file, so every config importing `@kubb/adapter-oas` paid for it even with `validate: false`.

Importing the adapter drops from 144ms to 88ms. With validation on, the cost moves into the parse step rather than going away.
