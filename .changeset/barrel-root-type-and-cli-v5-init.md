---
"@kubb/middleware-barrel": minor
"@kubb/cli": patch
---

Add `RootBarrelType` and restrict `'propagate'` to per-plugin barrel config; update `npx kubb init` for the v5 plugin ecosystem.

### `@kubb/middleware-barrel`

- Added `RootBarrelType = Exclude<BarrelType, 'propagate'>` — exported alongside `BarrelType`.
- `config.output.barrelType` (global) is now typed as `RootBarrelType | false`. Setting it to `'propagate'` is a type error; use `'all'` or `'named'` at the root level.
- Per-plugin `output.barrelType` continues to accept the full `BarrelType` (`'all' | 'named' | 'propagate'`).

### `@kubb/cli`

- `npx kubb init` now reflects the v5 plugin ecosystem: removed `plugin-oas` (handled automatically by `defineConfig`), `plugin-solid-query`, `plugin-svelte-query`, and `plugin-swr`; added `plugin-mcp`, `plugin-cypress`, and `plugin-redoc`.
- Default scaffolded plugins list is now `['plugin-ts']`.
