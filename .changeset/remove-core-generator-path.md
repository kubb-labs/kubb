---
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
---

Remove core's generator path. `@kubb/kit` now owns resolvers, generators and macros, and `@kubb/core` only walks the input through each plugin's visit hooks.

Moved out of `@kubb/core`:

- `Resolver`, `createResolver`, `defineResolver`, `toFilePath`, `resolverOptions` and `defineGenerator`.
- The `Generator`, `GeneratorContext`, `ResolverInput`, `ResolverPatch` types and the other resolver option types. `@kubb/kit` exports them, and `ResolverLike` is gone: types name kit's `Resolver`.
- The `addGenerator`, `setResolver`, `addMacro` and `setMacros` composables, and the methods of the same name on core's setup context. Kit's `defineExtension` adds the methods back on its setup context.
- The `resolver`, `generators` and `macros` fields of `NormalizedPlugin`, and `KubbDriver.getResolver`.
- `ctx.resolver` and `ctx.getResolver` on the visit-hook context, now `PluginVisitContext`.
- The `kubb:generate:schema`, `kubb:generate:operation` and `kubb:generate:operations` hook types, which `@kubb/kit` now declares and fires.
- `renderGeneratorSchema`, `renderGeneratorOperation` and `renderGeneratorOperations` from `@kubb/core/mocks`.

Of these, `addGenerator`, `setResolver`, `setMacros`, `addMacro`, `Resolver`, `createResolver`, `defineResolver`, `defineGenerator` and `toFilePath` stay exported from `@kubb/core` as throwing stubs until v6. `@kubb/kit` 5.23.1 still imports them from core, so each one throws `KUBB_MOVED_TO_KIT` when called, with a link to the fix, instead of failing on a missing export.

To migrate a plugin:

1. Import `defineExtension`, `defineGenerator`, `createResolver` and the composables from `kubb/kit` instead of `@kubb/core`.
2. `ctx.addGenerator(...)`, `ctx.setResolver(...)`, `ctx.addMacro(...)` and `ctx.setMacros(...)` keep working in a plugin defined with kit's `defineExtension`, next to the composables.
3. Read another plugin's resolver with `ctx.getResolver(name)` in a generator. A generator's `ctx.resolver` and `ctx.options` work as before.

The composables report `KUBB_NO_CONTEXT` for a plugin defined with `defineExtension` or `definePlugin` from `@kubb/core`. `@kubb/kit` exports its own deprecated `definePlugin`, which runs kit's visitor. `@kubb/plugin-barrel` builds a barrel's banner and footer with the plugin's resolver from the build memo.
