---
'@kubb/core': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
---

Cut per-file overhead in the code-generation pipeline.

- `@kubb/parser-ts` `parse` is now synchronous, returning `string` directly instead of `Promise<string> | string`. The `emitImport` / `emitExport` string-emit helpers are removed, and import and export statements are generated through the TypeScript compiler API as before.
- `@kubb/core` `Parser.parse` is typed as `string` (synchronous). Adapter initialisation consolidates the streaming and non-streaming branches, removing a duplicate debug-log path. `flushPendingFiles` removes a dead `snapshot` parameter.
- `@kubb/adapter-oas` caches the underlying `BaseOas` instance and the schema parser at adapter scope so the schemas and operations iterables share one instance instead of rebuilding indexes per pass.
