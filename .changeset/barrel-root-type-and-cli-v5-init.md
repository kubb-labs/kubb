---
"@kubb/middleware-barrel": minor
"@kubb/cli": patch
"@kubb/core": patch
---

Add `RootBarrelType = Exclude<BarrelType, 'propagate'>`. `config.output.barrelType` (global) is now typed as `RootBarrelType | false`. Update `npx kubb init` to reflect the v5 plugin ecosystem. Fix `output.format` JSDoc `@default` to `'auto'`.
