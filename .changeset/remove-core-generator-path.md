---
'@kubb/core': major
'@kubb/kit': major
'@kubb/plugin-barrel': patch
---

Remove core's generator path. `@kubb/kit` now owns resolvers, generators and macros, and `@kubb/core` only walks the input through each plugin's visit hooks.

Removed from `@kubb/core`:

- `Resolver`, `createResolver`, `defineResolver`, `toFilePath`, `resolverOptions` and `defineGenerator`.
- The `Generator`, `GeneratorContext`, `ResolverInput`, `ResolverLike`, `ResolverPatch` types and the other resolver option types.
- The `addGenerator`, `setResolver`, `addMacro` and `setMacros` composables, and the methods of the same name on the setup context.
- The `resolver`, `generators` and `macros` fields of `NormalizedPlugin`, and `KubbDriver.getResolver`.
- `ctx.resolver` and `ctx.getResolver` on the visit-hook context, now `PluginVisitContext`.
- The `kubb:generate:schema`, `kubb:generate:operation` and `kubb:generate:operations` hook types, which `@kubb/kit` now declares and fires.
- `renderGeneratorSchema`, `renderGeneratorOperation` and `renderGeneratorOperations` from `@kubb/core/mocks`.

To migrate a plugin:

1. Import `defineExtension`, `defineGenerator`, `createResolver` and the composables from `kubb/kit` instead of `@kubb/core`.
2. Replace `ctx.addGenerator(...)`, `ctx.setResolver(...)`, `ctx.addMacro(...)` and `ctx.setMacros(...)` with the composables `addGenerator(...)`, `setResolver(...)`, `addMacro(...)` and `setMacros(...)`.
3. Read another plugin's resolver with `ctx.getResolver(name)` in a generator. A generator's `ctx.resolver` and `ctx.options` work as before.

The composables report `KUBB_NO_CONTEXT` for a plugin defined with `defineExtension` from `@kubb/core`. `@kubb/plugin-barrel` now builds the banner and footer of a barrel with kit's default resolver.
