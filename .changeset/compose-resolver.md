---
'@kubb/core': minor
'@kubb/kit': minor
---

`Resolver.merge` now accepts plain settings such as `{ pluginName }` as its base, so a plugin can build its resolver from presets shared with other plugins. `ResolverPatch` is renamed to `ResolverPartial`. `ResolverPatch` still works as a deprecated alias until v6.
