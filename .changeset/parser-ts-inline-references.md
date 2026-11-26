---
'@kubb/parser-ts': patch
---

Inlining renames only names that refer to something outside the code. Parameters, type parameters, locals, method names and enum members stay as they are, and a shorthand property `{ petSchema }` keeps its key.
