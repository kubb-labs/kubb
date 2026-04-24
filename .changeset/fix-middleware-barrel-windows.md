---
"@kubb/middleware-barrel": patch
"@internals/utils": patch
---

Fix `middleware-barrel` failing on Windows due to mixed path separators.

- `buildTree` now POSIX-normalizes its root path so all child paths use forward slashes.
- `getBarrelFiles` indexes source files on POSIX-normalized paths, restoring the `'named'` strategy on Windows.
- `getPluginOutputPrefix` / `isExcludedPath` POSIX-normalize both sides so plugins with `barrelType: false` are correctly excluded from the root barrel.
- New `toPosixPath` helper exported from `@internals/utils` centralizes the conversion.
