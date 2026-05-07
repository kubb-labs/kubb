---
'@kubb/cli': patch
---

Make `@kubb/adapter-oas` an optional peer dependency of `@kubb/cli` for the `kubb validate` command.

The CLI now lazy-loads `@kubb/adapter-oas` only when validation runs and shows install guidance when that package is not available.
