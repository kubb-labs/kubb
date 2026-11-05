---
"@kubb/adapter-oas": patch
"@kubb/core": patch
---

Report `KUBB_DUPLICATE_DISCRIMINATOR` when two `oneOf` or `anyOf` members share a discriminator value. The warning names the value, the schemas, and the spec pointer, so the spec can be fixed before a generated `z.discriminatedUnion` throws on its first parse.
