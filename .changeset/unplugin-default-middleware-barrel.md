---
"unplugin-kubb": patch
---

Mirror `@kubb/kubb`'s `defineConfig` defaults inside `unplugin-kubb`:

- `middleware` defaults to `[middlewareBarrel]` when not provided.
- `output.barrelType` defaults to `'named'` when `middlewareBarrel` is part of the resolved `middleware` list.
- Re-exports the `BarrelType` type from `@kubb/middleware-barrel` for convenience.
