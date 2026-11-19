---
'@kubb/core': minor
'@kubb/kit': minor
---

Add `Resolver.compose(pluginName, ...presets)`. It builds a plugin resolver from shared presets with `Resolver.merge`, so plugins that share naming rules no longer repeat them.
