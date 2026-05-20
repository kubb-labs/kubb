---
'@kubb/adapter-oas': minor
---

All OpenAPI specs now go through the streaming path, removing the size-based threshold that previously switched between eager and lazy parsing.

The adapter's internal streaming logic is extracted into a dedicated `stream.ts` module (`preScan`, `createInputStream`, `resolveBaseUrl`) so it can be tested in isolation without going through the full adapter pipeline.

`preScan` runs once and its result is cached at adapter scope alongside the document, schema objects, schema parser, and `BaseOas` instance — so calling `parse()` and `stream()` on the same adapter instance does not repeat the pre-scan or rebuild the parser indexes.
