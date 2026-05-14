---
'@kubb/core': patch
---

Further reduce peak memory and redundant work during code generation.

- **Per-plugin streaming writes**: files are written to `config.storage` after each plugin completes instead of all at once at the end of the build. Already-written files are skipped on subsequent flushes via a `writtenPaths` set.
- **`PARALLEL_CONCURRENCY_LIMIT` lowered from 100 → 16** — each flush only processes the files one plugin generated. 16 in-flight tasks bounds the number of `CodeNode` trees alive during rendering; I/O latency is the bottleneck so higher values offer no meaningful throughput improvement.
- **`PluginDriver.dispose()` now clears `#resolvers` and `#defaultResolvers`** so resolver closures (which may capture plugin options) are released when the driver is disposed at the end of a build.
- **`createSourcesView.getKeys(base)` avoids materialising the full key array** before filtering — it now iterates the `Set` directly and only allocates the result array.
