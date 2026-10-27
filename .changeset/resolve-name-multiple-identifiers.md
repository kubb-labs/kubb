---
"@kubb/core": minor
---

Let `resolveName`'s `normalize` return several names, so a declaration that emits more than one identifier takes a name only when all of them are free. A plugin naming an enum no longer has to allocate its value and its type alias in two passes.

Accept `node` and `scope` in place of a hand-built `key`, so an operation's declarations are keyed by the operation they belong to: `resolveName({ node, scope: ['response', 'status', 404], name })`.
