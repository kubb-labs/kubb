---
'@kubb/ast': minor
---

`transform` now preserves identity (structural sharing): when a pass leaves a node and all its descendants unchanged it returns the same reference instead of reallocating the subtree. No-op rewrites become free and callers can detect "nothing changed" by reference, which keeps caches valid and cuts allocations on large specs. Adds an `update(node, changes)` factory, an identity-preserving shallow update, the analogue of the TypeScript compiler's `factory.updateX`.
