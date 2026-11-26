---
'@kubb/ast': minor
---

`inlineFiles` writes an inlined type that a file uses more than once as one local, non-exported declaration in that file, instead of repeating its body at every use. A type used once, or one that only names another, is still written in place. Exported functions keep their written return types, so `isolatedDeclarations` keeps working, and a type that refers to itself, such as a tree node, now inlines.
