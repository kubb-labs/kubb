---
'@kubb/ast': patch
---

**Performance: persist schema signatures in a process-wide `WeakMap`**

`signatureOf` now memoizes node → digest in a module-level `WeakMap` keyed by node identity, instead of a fresh `Map` per `schemaSignature`/`buildDedupePlan`/`applyDedupe` call. During streaming, each top-level schema tree was hashed twice — once by `schemaSignature` and again by `applyDedupe` — so a node is no longer re-hashed once it has been seen. Entries are released when the node is garbage-collected, and reuse is sound because signatures depend only on a node's (immutable) content.
