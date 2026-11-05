---
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Warn with `KUBB_DUPLICATE_DISCRIMINATOR` when two `oneOf`/`anyOf` members pin the declared `discriminator` property to the same value, pointing at the union in the spec. Such a union can't pick a branch, and Zod's `z.discriminatedUnion` throws `Duplicate discriminator value` on the first parse.
