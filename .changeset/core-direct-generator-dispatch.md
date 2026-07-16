---
'@kubb/core': patch
---

Call plugin generators directly in `KubbDriver` instead of registering them as listeners on the `Hookable` event bus. Each generator used to be wrapped in a closure that re-checked the owning plugin name and fired for every plugin on every node, so N plugins produced a quadratic listener fan-out where all but one call returned immediately. Generators now live on their plugin and run in the generate loop. The `kubb:generate:schema`, `kubb:generate:operation`, and `kubb:generate:operations` hooks still fire for external listeners.

Operations are collected in a single pass and reused for the `operations` batch, so a plugin with both an `operation` and an `operations` generator no longer resolves each operation twice.
