---
'@kubb/core': patch
---

Register generators, resolvers and macros in `setup` or `kubb:plugin:setup` with the `addGenerator`, `setResolver`, `addMacro` and `setMacros` composables from `@kubb/kit`, or with the methods of the same name on the setup context of a plugin defined with kit's `defineExtension`. Both styles work, and neither is deprecated.
