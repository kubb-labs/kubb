---
"@kubb/core": patch
---

Replace the `semver` dependency (~16 KB gzipped) with a lightweight inline helper in `packageJSON.ts`. The `coerceSemver` and `satisfiesSemver` functions cover all operators (`>=`, `>`, `<=`, `<`, `=`, `^`, `~`) needed for `satisfiesDependency`.
