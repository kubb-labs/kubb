---
'@kubb/core': patch
---

Fix `KUBB_NO_CONTEXT` for plugins that a CommonJS config loads. The ESM and CommonJS builds of `@kubb/core` now share one plugin context, so composables such as `setResolver()` work in both.
