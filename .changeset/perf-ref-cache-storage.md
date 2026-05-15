---
'@kubb/adapter-oas': minor
'@kubb/core': minor
---

**Performance: memoize `$ref` resolution and cache parsed documents via `config.storage`**

Two improvements that together make large specs like Stripe (~1 400 schemas) viable:

- **`resolvedRefCache`** — within a single `parse()` call, each `$ref` is now resolved at most once. Previously, a shared schema referenced from dozens of top-level schemas caused exponential sub-tree re-expansion. Stripe went from OOM at 8 GB to ~840 ms / ~15 MB.

- **Parsed-document disk cache** — on repeat builds, `parse()` skips the Redocly bundling step by reading the cached document from `config.storage` (keyed under `.kubb/.cache/`). Path-based sources are invalidated by file mtime; inline data sources by content hash.

`Adapter.parse` now accepts an optional second argument `storage?: Storage` — `createKubb` passes `config.storage` so any user-configured backend is used automatically. No changes required in user config.
