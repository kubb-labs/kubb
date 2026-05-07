---
'@kubb/cli': patch
---

Make `@kubb/adapter-oas` an optional peer dependency of `@kubb/cli` for adapter-driven CLI commands.

The CLI now lazy-loads `@kubb/adapter-oas` when `kubb validate` runs or when `kubb generate --adapter oas` is used, and shows install guidance when that package is not available.
