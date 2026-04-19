---
"@kubb/adapter-oas": patch
---

Embed discriminant values into union members.

Discriminated `oneOf`/`anyOf` unions now intersect each member with its narrowed discriminant literal, producing `(Cat & { type: 'cat' }) | (Dog & { type: 'dog' })` instead of plain `Cat | Dog`.

Child schemas extending a discriminated parent via `allOf` also carry the narrowed discriminant literal.
