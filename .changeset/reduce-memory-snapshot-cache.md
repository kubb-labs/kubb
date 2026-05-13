---
'@kubb/core': patch
---

Further reduce peak memory and redundant work during code generation.

- **`getFilesSnapshot()` is now cached** between `flushPendingFiles()` calls. Event payloads that expose a lazy `.files` getter (e.g. `kubb:plugin:end`) previously rebuilt the merged Map + sorted Array on every access. The snapshot is now computed once per flush cycle and reused for all listeners within that cycle.
- **`processedFiles` Map is cleared in the `finally` block** of `safeBuild` so the Map's internal hash-table overhead is released immediately after the build, while `BuildOutput.files` still holds the actual `FileNode` references.
- **`PARALLEL_CONCURRENCY_LIMIT` lowered from 100 → 16** — with per-plugin streaming each flush only processes the files that one plugin generated. 16 in-flight tasks bounds the number of `CodeNode` trees alive during rendering; I/O latency is the bottleneck so higher values offer no meaningful throughput improvement.
- **`PluginDriver.dispose()` now clears `#resolvers` and `#defaultResolvers`** so resolver closures (which may capture plugin options) are released when the driver is disposed at the end of a build.
- **`createSourcesView.getKeys(base)` avoids materialising the full key array** before filtering — it now iterates the `Set` directly and only allocates the result array.
