---
'kubb': patch
---

Add `kubb/unplugin`, which re-exports `unplugin-kubb`: `generateModule`, `selectConfig`, and the config loaders. Tools such as `openapi-import` can then depend on `kubb` alone.
