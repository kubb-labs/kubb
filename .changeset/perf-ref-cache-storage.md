---
'@kubb/adapter-oas': patch
---

Memoize `$ref` resolution within `parse()`.

With `resolvedRefCache`, each `$ref` is now resolved at most once per `parse()` call. Before this, a shared schema referenced from dozens of top-level schemas caused exponential sub-tree re-expansion. Stripe (~1 400 schemas) went from OOM at 8 GB to ~840 ms / ~15 MB.
