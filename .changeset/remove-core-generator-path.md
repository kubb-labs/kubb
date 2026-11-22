---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Move resolvers, generators and macros from `@kubb/core` to `@kubb/kit`. Core now only walks the input through each plugin's visit hooks.

- Moved to `@kubb/kit`: `Resolver`, `createResolver`, `defineResolver`, `toFilePath`, `defineGenerator`, the `addGenerator`, `setResolver`, `addMacro` and `setMacros` composables, and the `Generator`, `GeneratorContext` and resolver types.
- Removed from core: `ResolverLike`, the `resolver`, `generators` and `macros` fields of `NormalizedPlugin`, `KubbDriver.getResolver`, `ctx.resolver` and `ctx.getResolver` on visit hooks, and the `renderGenerator*` mocks.
- The moved functions stay in `@kubb/core` until v6 as stubs that throw `KUBB_MOVED_TO_KIT` with a link to the fix.
- Kit's composables need a plugin defined with kit's `defineExtension`, and report `KUBB_NO_CONTEXT` otherwise.

To upgrade a plugin, import from `kubb/kit` instead of `@kubb/core`:

```diff
- import { createResolver, defineExtension, defineGenerator } from '@kubb/core'
+ import { createResolver, defineExtension, defineGenerator } from 'kubb/kit'
```
