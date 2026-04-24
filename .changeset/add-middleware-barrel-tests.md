---
"@kubb/middleware-barrel": patch
---

Add unit tests for `buildTree`, `getBarrelFiles`, `generatePerPluginBarrel`, and `generateRootBarrel`. Covers all three barrel strategies (`all`, `named`, `propagate`), edge cases (non-indexable sources, out-of-root files, extension filtering), and integration through the per-plugin and root barrel generators.
