---
"@kubb/middleware-barrel": patch
---

Fix three barrel-generation bugs: non-TypeScript files (`.json`, `.html`) no longer produce malformed exports; files with `isIndexable: false` are skipped from all barrel types instead of falling back to `export *`; `output.extension` mapping is now correctly applied to barrel export paths.
