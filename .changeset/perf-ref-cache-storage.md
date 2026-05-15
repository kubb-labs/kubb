---
'@kubb/adapter-oas': patch
---

**Performance: memoize `$ref` resolution within `parse()`**

`resolvedRefCache` — within a single `parse()` call, each `$ref` is now resolved at most once. Previously, a shared schema referenced from dozens of top-level schemas caused exponential sub-tree re-expansion. Stripe (~1 400 schemas) went from OOM at 8 GB to ~840 ms / ~15 MB.
