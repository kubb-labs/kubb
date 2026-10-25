---
"@kubb/adapter-oas": patch
"@kubb/kit": patch
---

Discriminator mapping keys now take the type of the discriminator property. An `integer`, `number` or `boolean` discriminator produces `type_id: 1` or `z.literal(1)` instead of the string `'1'`, so the union members no longer collapse to `never` and valid payloads pass validation.
