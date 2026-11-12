---
"@kubb/ast": patch
---

`ast.schema.find` takes an optional `cache` (a `WeakMap` you keep per predicate), so repeated searches with `followRefs` skip parts of the schema graph they already searched.
