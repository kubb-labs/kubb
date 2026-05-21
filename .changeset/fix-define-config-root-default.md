---
"kubb": patch
---

`defineConfig` now defaults `root` to `process.cwd()` when omitted. This fixes `The "paths[0]" argument must be of type string. Received undefined` thrown after successful generation when `kubb.config.ts` did not define `root` (the CLI then called `path.resolve(config.root, …)` on the un-normalized config). `@kubb/core`'s internal `resolveConfig` already defaulted `root` for the driver, so generation itself succeeded — the error fired in the CLI's post-generation `outputPath` resolution.
