---
"@kubb/middleware-barrel": minor
---

Restore per-subdirectory barrel generation and fix `barrelType: false` exclusion from root barrel.

- `barrelType: false` on a plugin now correctly excludes that plugin's files from the root `index.ts` barrel.
- Per-subdirectory barrels (e.g. `models/ts/petController/index.ts`) are generated again when a plugin uses `group` and `barrelType: 'named'` or `'all'`. The `getBarrelFiles` utility now accepts a `recursive` option; `generatePerPluginBarrel` passes `recursive: true` while `generateRootBarrel` keeps the default of `false`.
- Type-only re-exports now use `export type { ... }` to satisfy `verbatimModuleSyntax` (fixes TS1205).
- `getBarrelFiles` now takes an options object `{ outputPath, files, barrelType, recursive? }` instead of positional arguments.
