---
'@kubb/core': patch
'@kubb/kit': patch
---

`@kubb/core` and `@kubb/kit` now export the `PluginOptions` and `ResolvedPluginOptions` types. Plugin authors can build a plugin's `Options` and `ResolvedOptions` from them instead of repeating `output`, `group`, `exclude`, `include`, and `override`.
