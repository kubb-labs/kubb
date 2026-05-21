---
"@kubb/cli": patch
---

Fix `The "paths[0]" argument must be of type string. Received undefined` thrown after successful generation when `kubb.config.ts` does not define `root`. `getConfigs` now defaults `root` to `process.cwd()` at the CLI boundary, matching the driver-internal normalization in `@kubb/core`.
