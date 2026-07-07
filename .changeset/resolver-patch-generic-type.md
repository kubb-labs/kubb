---
'@kubb/core': major
'@kubb/kit': major
---

Rename `ResolverOverride` to `ResolverPatch` and make it generic so `Resolver.merge` and `setResolver` accept a full resolver instance without a cast.

- `ResolverPatch<T extends Resolver = Resolver>` (was `ResolverOverride`, non-generic). Parameterize it with a concrete resolver type (`ResolverPatch<ResolverTs>`) to type-check namespace overrides and bind `this` to the full resolver. The bare `ResolverPatch` still accepts any resolver's fields.
- `Resolver.merge` and `KubbPluginSetupContext['setResolver']` now accept `ResolverPatch<T> | T` (previously only `ResolverOverride`), so a plugin's own preset resolver, or a merge of it with a user override, passes straight through.
- `KubbDriver.setPluginResolver` accepts `ResolverPatch | Resolver` to match.

Before this fix, a real `Resolver` instance (a class with a private field) couldn't satisfy `ResolverOverride`'s index signature, so every built-in plugin needed `ctx.setResolver(... as unknown as ResolverOverride)` to work around a typecheck-only failure. That workaround is no longer needed.

```ts
// before
ctx.setResolver((userResolver ? Resolver.merge(resolverTs, userResolver) : resolverTs) as unknown as ResolverOverride)

// after
ctx.setResolver(userResolver ? Resolver.merge(resolverTs, userResolver) : resolverTs)
```

Update any `ResolverOverride` import to `ResolverPatch`.
