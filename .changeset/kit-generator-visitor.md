---
'@kubb/kit': patch
'@kubb/core': patch
---

`@kubb/kit` owns `Resolver`, `createResolver`, `defineResolver`, `toFilePath` and `defineGenerator`. Plugins defined with kit's `defineExtension` keep their resolver, generators and macros in the build memo, and kit runs them through the plugin visit hooks.

The generator context gains `ctx.operations` and `ctx.dispatch()`. The driver stores the shared-schema data in memo before setup, typed as `kubb:sharedSchemas` in `Kubb.MemoRegistry`.
