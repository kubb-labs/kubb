---
"@kubb/adapter-oas": patch
---

An `allOf` member that only holds annotations (`description`, `title`, `example`) or `if`/`then`/`else` no longer becomes `unknown`. The annotations move onto the parent schema. The conditional keywords are dropped, not enforced.
