---
'@kubb/ast': minor
---

`inlineFiles` declares a type used more than once, and any value that is not a bare name, once per file instead of repeating it. A type that refers to itself now inlines too.
