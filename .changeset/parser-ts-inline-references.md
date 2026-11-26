---
'@kubb/parser-ts': patch
---

Inlining renames only free references. Parameters, type parameters, locals, methods and enum members stay as they are, and `{ petSchema }` keeps its key.
