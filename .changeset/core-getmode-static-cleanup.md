---
"@kubb/core": minor
---

`getMode` is now a static method on `PluginDriver` instead of a standalone export.

The following are also removed from `@kubb/core`'s public API: `formatters`, `linters`, `detectFormatter`, `detectLinter` (moved to `@internals/utils`), and `satisfiesDependency` (internal only).
