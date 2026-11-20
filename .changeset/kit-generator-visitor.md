---
'@kubb/kit': patch
'@kubb/core': patch
---

Plugins defined with kit's `defineExtension` keep their resolver, generators and macros in the build memo. Kit runs them through the plugin visit hooks with `generatorVisitor`, with the same output as core's generator path. A plugin defined with core's `defineExtension` keeps the core path. The driver now stores the shared-schema data in memo before setup, typed as `kubb:sharedSchemas` in `Kubb.MemoRegistry`, so `setResolver` can read it. The generator context gains `ctx.operations` and `ctx.dispatch()`, so code that ran through the deprecated `ctx.driver` no longer needs it.
