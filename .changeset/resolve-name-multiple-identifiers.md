---
"@kubb/core": minor
---

Let `resolveName`'s `normalize` return several names, so a declaration that emits more than one identifier takes a name only when all of them are free. A plugin naming an enum no longer has to allocate its value and its type alias in two passes.
