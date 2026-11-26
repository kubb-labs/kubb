---
'@kubb/ast': minor
---

`inlineFiles` writes an inlined type that a file uses more than once, or that a use needs by name, as one local declaration instead of repeating it. A type that refers to itself now inlines too. An inlined value, other than a bare name, becomes one local constant, so it is built once instead of at every use.
