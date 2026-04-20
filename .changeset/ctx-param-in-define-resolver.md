---
"@kubb/core": patch
---

Replace `this` with explicit `ctx` parameter in `defineResolver` builder.

### `@kubb/core`

- `ResolverBuilder<T>` now receives the assembled resolver as `ctx` instead of using `ThisType<T['resolver']>`.
- `defaultResolveFile` accepts the resolver as an explicit `ctx: Resolver` third parameter instead of a `this` receiver.
- `defineResolver` creates the resolver shell first and passes it to the builder, so `ctx` methods resolve lazily and include any builder overrides.

Migration: replace `this.xxx(...)` calls inside `defineResolver` builders with `ctx.xxx(...)`.
