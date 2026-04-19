---
"@kubb/core": minor
---

`getMode` is now a static method on `PluginDriver` instead of a standalone export.

**Before:**

```ts
import { getMode } from "@kubb/core";
getMode("src/gen/types.ts"); // 'single'
```

**After:**

```ts
import { PluginDriver } from "@kubb/core";
PluginDriver.getMode("src/gen/types.ts"); // 'single'
```

The following utilities have also been removed from `@kubb/core`'s public API as they are internal post-processing helpers used only by CLI/agent tooling:

- `formatters` — moved to `@internals/utils`
- `linters` — moved to `@internals/utils`
- `detectFormatter` — moved to `@internals/utils`
- `detectLinter` — moved to `@internals/utils`
- `satisfiesDependency` — internal only, no longer exported
