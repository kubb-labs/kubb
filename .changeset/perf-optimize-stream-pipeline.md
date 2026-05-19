---
'@kubb/core': patch
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
'@kubb/renderer-jsx': patch
---

Significantly reduce per-file overhead in the code-generation pipeline.

- `@kubb/parser-ts` now reuses one `ts.createPrinter()` instance across all files (instead of one per file) and emits `import` / `export` statements as strings directly, bypassing the TypeScript compiler API on the hot path. New `emitImport` / `emitExport` helpers are exported alongside the existing `createImport` / `createExport` AST factories.
- `@kubb/adapter-oas` caches the underlying `BaseOas` instance and the schema parser at adapter scope so the schemas and operations iterables share one instance instead of rebuilding indexes per pass.
- `@kubb/core` dispatches per-plugin schema/operation handlers concurrently via `Promise.all` while keeping each plugin's own generator chain sequential, parses output files with a bounded concurrency cap (4), and skips the per-node `resolveOptions` call when the plugin has no include/exclude/override filters.
- `@kubb/renderer-jsx` `jsxRendererSync` now returns a synchronous iterable from `stream`, letting consumers skip the per-file microtask. `Renderer.stream` accepts either an `Iterable` or `AsyncIterable`.
