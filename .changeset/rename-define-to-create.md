---
"@kubb/core": major
"@kubb/kit": major
---

Rename `defineResolver` to `createResolver`.

- `createResolver` takes a plain object (the `() =>` wrapper is no longer needed) and returns a `Resolver` class instance.
- `mergeResolver` is removed; use `Resolver.merge` instead.
- `Resolver` is exported from `@kubb/core` and `@kubb/kit`.

Other `define*` factories (`definePlugin`, `defineGenerator`, `defineParser`, `defineConfig`) are unchanged.
