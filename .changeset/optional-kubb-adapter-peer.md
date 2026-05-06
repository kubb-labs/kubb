---
'kubb': patch
---

Make `@kubb/adapter-oas` an optional peer dependency of `kubb`, matching the optional install flow already used for `@kubb/agent` and `@kubb/mcp`.

`defineConfig` still auto-loads `adapterOas()` when the package is installed, and now throws a clearer error when an input-based config relies on the default adapter without having `@kubb/adapter-oas` available.
