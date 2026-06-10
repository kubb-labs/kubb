---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/mcp': minor
---

Performance improvements and event API cleanup in `KubbDriver` and `FileManager`.

## Breaking changes

`kubb:file:processing:update` (singular, fired once per file) is replaced by `kubb:files:processing:update` (plural, fired once per flush chunk with a `files` array). Update any listener from:

```ts
hooks.on('kubb:file:processing:update', ({ file, source, processed, total, percentage, config }) => {
  // handle one file
})
```

to:

```ts
hooks.on('kubb:files:processing:update', ({ files }) => {
  for (const { file, source, processed, total, percentage, config } of files) {
    // handle each file
  }
})
```

`KubbFileProcessingUpdateContext` is renamed to `KubbFileProcessingUpdate` (the per-item type). A new `KubbFilesProcessingUpdateContext` wraps `files: Array<KubbFileProcessingUpdate>`.

## Performance improvements

- `FileManager` sorts lazily: the sorted view is rebuilt from `#cache` only when `files` is read, not on every `add`/`upsert`. Upserts are now O(1) with a single `null` assignment to mark the view stale.
- `FileManager.#store` fast-paths single-file calls (the common case), skipping the intermediate deduplication `Map`.
- `mergeFile` avoids array allocations when one side's `sources`/`imports`/`exports` is empty, returning the non-empty reference directly.
- `createFile` (SHA-256 + import/export combining) is skipped for new files that don't require merging with an existing cache entry.
- `kubb:generate:schema` and `kubb:generate:operation` are gated on `listenerCount`, so builds with no listeners on these channels drop the per-node emit overhead entirely.
- `FileProcessor` is a long-lived class field on `KubbDriver` rather than a per-`run()` scoped resource.
- `dispose()` methods added to `FileProcessor`, `Kubb`, and `Renderer` implementations, with `[Symbol.dispose]()` delegating to them consistently across the codebase.
