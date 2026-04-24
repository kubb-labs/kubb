---
"@kubb/middleware-barrel": patch
"kubb": patch
---

Refactor middleware-barrel internals and tighten `barrelType` defaulting.

- `buildTree` is now exported from `@internals/utils` and reused by `@kubb/middleware-barrel`.
- `middleware-barrel` utils are split into focused modules (`resolveBarrelType`, `excludedPaths`, `getBarrelFiles`, `generatePerPluginBarrel`, `generateRootBarrel`), each with its own test file.
- `output.barrelType` now only defaults to `'named'` when `middlewareBarrel` is part of the resolved `middleware` list. Custom middleware lists without it leave `barrelType` untouched.
- Internal use of Node 22 helpers (`path.extname`, `String.prototype.replaceAll`, `Iterator.prototype.some`) for clearer, allocation-free path handling.
