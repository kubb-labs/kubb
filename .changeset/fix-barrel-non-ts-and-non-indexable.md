---
"@kubb/middleware-barrel": patch
---

Fix three barrel-generation bugs. Non-TypeScript files (`.json`, `.html`) no longer produce malformed exports. Files with `isIndexable: false` are skipped from all barrel types instead of falling back to `export *`. The `output.extension` mapping is now applied to barrel export paths.
