---
'@kubb/core': minor
---

Add an optional `match` predicate to `Generator`. When `match(node, ctx)` returns `false`, the driver skips that node's `schema`/`operation` call entirely, instead of invoking the generator and letting it return early itself. Omit `match` to keep running for every node, so this is purely additive.

This lets a generator declare its own scope instead of a plugin hand-rolling a dispatcher when several generators target the same node type but only one should run per node.
