---
'@kubb/ast': minor
---

`inlineFiles` writes an inlined type that a file uses more than once as one local declaration instead of repeating it, and a type that refers to itself now inlines too. An inlined value, other than a bare name, becomes one local constant, so it is built once instead of at every use.
