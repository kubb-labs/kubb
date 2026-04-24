---
"@kubb/middleware-barrel": patch
---

Fix `barrelType` TypeScript error when using `@kubb/middleware-barrel`.

The global type augmentation that adds `barrelType` to `Output` was only reachable via a transitive side-effect import. TypeScript does not reliably follow side-effect imports through re-export chains, so `barrelType` appeared as an unknown property. The fix imports `./types.ts` directly in the package entry point, guaranteeing the augmentation is applied whenever the package is imported.
