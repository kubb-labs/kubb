---
"@kubb/core": patch
---

Replace `this` with explicit `ctx` parameter in `defineResolver` builders. `ResolverBuilder<T>` now receives the assembled resolver as `ctx`; `defaultResolveFile` takes it as a third parameter instead of a `this` receiver.

Migration: replace `this.xxx(...)` calls inside `defineResolver` builders with `ctx.xxx(...)`.
