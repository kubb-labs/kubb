---
"@kubb/core": minor
---

Remove unused `TContext` and `TResolvePathOptions` generics from `PluginFactoryOptions`.

`PluginFactoryOptions` previously had six generics — `TName`, `TOptions`, `TResolvedOptions`, `TContext`, `TResolvePathOptions`, and `TResolver`. The `TContext` and `TResolvePathOptions` parameters were never accessed via `TOptions['context']` or `TOptions['resolvePathOptions']` anywhere in the codebase, and every plugin passed `never` / `object` as their values.

**Before**
```ts
type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, object, ResolverZod>
```

**After**
```ts
type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, ResolverZod>
```

Migrate any custom plugin types by removing the 4th (`TContext`) and 5th (`TResolvePathOptions`) positional arguments.
