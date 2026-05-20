---
'@kubb/adapter-oas': minor
---

All OpenAPI specs now go through the streaming path, removing the size-based threshold that previously switched between eager and lazy parsing.

The adapter's internal streaming logic is extracted into a dedicated `stream.ts` module (`preScan`, `createInputStream`, `resolveBaseUrl`) so it can be tested in isolation without going through the full adapter pipeline.

`preScan` and the other internal `ensure*` helpers each run at most once per adapter instance. Concurrent callers (e.g. `stream()` and `parse()` called simultaneously) share the same in-flight work and cannot trigger duplicate parses or validation passes.
