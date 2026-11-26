---
'@kubb/ast': minor
---

`inlineFiles` writes an inlined type that a file uses more than once as one local declaration instead of repeating it. A type that refers to itself now inlines too.
