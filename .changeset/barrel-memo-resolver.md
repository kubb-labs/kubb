---
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Add `getResolver(name, memo?)` to `@kubb/kit`, which returns a plugin's resolver from the build memo in any hook.

- Without a stored resolver, it stores and returns the default one for that plugin.
- `@kubb/plugin-barrel` uses it, so a plugin defined with kit's `defineExtension` gets its own resolver in barrel banners and footers.
