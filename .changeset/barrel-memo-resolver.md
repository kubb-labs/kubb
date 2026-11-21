---
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Add `getResolver(name, memo?)` to `@kubb/kit`. It returns the resolver a plugin keeps in the build memo, or stores and returns a default resolver for that plugin. It reads the memo of the running hook, so it works in generators and in every plugin hook, such as `kubb:plugins:end`. `@kubb/plugin-barrel` uses it for barrel banners and footers, so a plugin defined with kit's `defineExtension` gets its own resolver there.
