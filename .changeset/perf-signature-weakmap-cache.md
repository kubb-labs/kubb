---
'@kubb/ast': patch
---

Persist schema signatures in a process-wide `WeakMap`.

`signatureOf` now memoizes node → digest in a module-level `WeakMap` keyed by node identity, instead of a fresh `Map` per `signatureOf`/`buildDedupePlan`/`applyDedupe` call. During streaming, each top-level schema tree was hashed twice, once by `signatureOf` and again by `applyDedupe`, so a node is no longer re-hashed once it has been seen. Entries are released when the node is garbage-collected, and reuse is sound because signatures depend only on a node's (immutable) content.
