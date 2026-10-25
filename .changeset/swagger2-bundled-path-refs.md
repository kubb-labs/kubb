---
"@kubb/adapter-oas": patch
---

A Swagger 2.0 spec that uses the same external `$ref` twice inside a response schema no longer fails with `KUBB_REF_NOT_FOUND`. The bundler's second reference pointed at the old `responses/200/schema` location, which the upgrade to 3.x moves, so such references are now inlined before the upgrade.
