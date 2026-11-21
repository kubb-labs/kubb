---
'@kubb/core': patch
'@kubb/kit': patch
---

`PluginType` from `@kubb/core` now takes only the name, options and resolved options. `PluginType` from `@kubb/kit` adds the resolver and printer as its fourth and fifth type arguments, with the resolver defaulting to `Resolver`, so `PluginType<'plugin-ts', Options, ResolvedOptions, ResolverTs>` keeps working when imported from `@kubb/kit`. The `KUBB_NO_CONTEXT` message from core now says the composable ran outside a plugin hook.
