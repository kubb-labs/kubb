---
"@kubb/ast": patch
"@kubb/adapter-oas": patch
---

The `encoding` of a form or multipart request body is now read into the AST. Each content entry of the request body carries an `encoding` record with the `contentType`, `style`, `explode` and `allowReserved` of every property that sets one, so plugins can serialize `application/x-www-form-urlencoded` and `multipart/form-data` bodies the way the spec describes.
