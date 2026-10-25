---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Each request body content entry now carries an `encoding` record with the `contentType`, `style`, `explode` and `allowReserved` of every property that sets one in the spec.
