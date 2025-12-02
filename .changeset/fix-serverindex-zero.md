---
"@kubb/plugin-oas": patch
---

Fix `serverIndex: 0` not resolving to `servers[0].url` in generated code. The condition `if (serverIndex)` was treating 0 as falsy, causing `getBaseURL()` to return undefined instead of the first server URL.
