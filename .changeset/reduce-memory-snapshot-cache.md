---
'@kubb/core': patch
---

Further reduce peak memory during code generation.

- Files are written to `config.storage` after each plugin completes, not all at once. Already-written files are skipped via a `writtenPaths` set.
- `PluginDriver.dispose()` now clears `#resolvers` and `#defaultResolvers` so resolver closures are released at end of build.
- `createSourcesView.getKeys(base)` iterates the `Set` directly instead of materialising the full key array.
