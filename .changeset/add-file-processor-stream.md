---
"@kubb/core": minor
---

Add `FileProcessor.stream()` — an async generator that yields one `ParsedFile` at a time. `run()` now delegates to `stream()` internally, removing the `mode: 'sequential' | 'parallel'` option and the `p-limit` dependency.

`safeBuild()` now flushes files after each plugin rather than all at once at the end, so parsed strings from plugin N are eligible for GC before plugin N+1 begins.

Removed: `p-limit` dependency, `PARALLEL_CONCURRENCY_LIMIT` constant, `mode` option from `FileProcessor.run()`.
