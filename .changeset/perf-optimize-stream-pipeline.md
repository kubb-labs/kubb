---
'@kubb/core': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
'@kubb/renderer-jsx': patch
---

Significantly reduce per-file overhead in the code-generation pipeline.

- `@kubb/parser-ts` `parse` is now synchronous — returns `string` directly instead of `Promise<string> | string`. `FileProcessor.stream` is a plain `Generator` instead of `AsyncGenerator`, removing a microtask per file. The `emitImport` / `emitExport` string-emit helpers have been removed; import and export statements are generated through the TypeScript compiler API as before.
- `@kubb/core` `Renderer.stream` now returns `Iterable<FileNode>` only — `AsyncIterable` support has been dropped. `Parser.parse` is typed as `string` (synchronous). Adapter initialisation consolidates the streaming / non-streaming branches, removing a duplicate debug-log path. `flushPendingFiles` removes a dead `snapshot` parameter.
- `@kubb/adapter-oas` caches the underlying `BaseOas` instance and the schema parser at adapter scope so the schemas and operations iterables share one instance instead of rebuilding indexes per pass.
- `@kubb/renderer-jsx` `jsxRendererSync` returns a synchronous `Generator` from `stream`, letting consumers skip the per-file microtask.
