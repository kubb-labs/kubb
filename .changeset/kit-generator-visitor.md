---
'@kubb/kit': patch
'@kubb/core': patch
---

`@kubb/kit` owns `Resolver`, `createResolver`, `defineResolver`, `toFilePath` and `defineGenerator`, and runs a plugin's generators through the plugin visit hooks.

- Plugins defined with kit's `defineExtension` keep their resolver, generators and macros in the build memo.
- The generator context gains `ctx.operations` and `ctx.dispatch()`.
