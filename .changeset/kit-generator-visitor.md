---
'@kubb/kit': patch
'@kubb/core': patch
---

`@kubb/kit` now owns `Resolver`, `createResolver`, `defineResolver`, `toFilePath` and `defineGenerator`, and no longer re-exports them from `@kubb/core`. Core's types name the new structural `ResolverLike` instead of the class, so a resolver from either package fits them. Core keeps its own copy for plugins on the core path.

Plugins defined with kit's `defineExtension` keep their resolver, generators and macros in the build memo. Kit runs them through the plugin visit hooks, with the same output as core's generator path. A plugin defined with core's `defineExtension` keeps the core path.

The generator context gains `ctx.operations` and `ctx.dispatch()`. The driver stores the shared-schema data in memo before setup, typed as `kubb:sharedSchemas` in `Kubb.MemoRegistry`.

In `@kubb/core`, `Resolver`, `createResolver`, `defineResolver`, `toFilePath`, `defineGenerator` and the `Generator`, `GeneratorContext` and `ResolverInput` types are deprecated in favor of the same names from `@kubb/kit`, and so are the `resolver`, `macros` and `generators` fields of `NormalizedPlugin`. A plugin that still runs generators through core's path gets one `KUBB_PLUGIN_WARNING` per build that points to kit's `defineExtension`. Everything keeps working until the next major version.
