---
'@kubb/ast': patch
---

An inlined import that clashes with a name in the importing file now gets an alias, such as `Options as Options2`, instead of declaring `Options` twice.
