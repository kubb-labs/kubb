---
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Add `getResolver({ memo }, name)` to `@kubb/kit`. It returns the resolver a plugin keeps in the build memo, or a default resolver for that plugin. `@kubb/plugin-barrel` uses it for barrel banners and footers, so a plugin defined with kit's `defineExtension` gets its own resolver there.
