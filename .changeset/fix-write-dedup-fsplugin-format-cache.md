---
'@kubb/core': patch
'@kubb/cli': patch
---

Fix two cases where `write()`'s unchanged-content check failed to skip a file that hadn't actually changed, causing spurious rewrites and file-watcher churn on every rebuild.

**Barrel files were rewritten on every build (#3867).** `fabric.use(fsPlugin)` registered its own raw `file:processing:update` listener that wrote straight to disk, bypassing `output.storage` and duplicating the write the `storage.setItem` listener already performs. Its own unchanged-content check compared the untrimmed generated text against the trimmed content already on disk, so it always "changed" for files with no sources — exactly the case for barrel (`index.ts`) files — and rewrote them on every build even though their content was identical. `build()` now drives `fabric.context.fileManager.write()` directly instead, so every write goes through the single, correctly-deduped `storage.setItem` path.

**`output.format` defeated the dedup check on the next build (#3859).** `output.format` runs as a CLI pass over the whole output directory after every file is written. A formatter's reflow (added semicolons, quote changes, reordered imports) changes bytes that the next build's freshly generated (pre-format) content can never match, so every file gets rewritten — and reformatted — on every build once a formatter is configured. `kubb generate` now wraps the storage with a manifest of the pre-format content hash last written per path, so a file the formatter already normalized is recognized as unchanged instead of being rewritten.

`formatCacheStorage` now lives in `@kubb/core` (exported alongside `fsStorage` and `memoryStorage`) instead of being a CLI-only utility, so any caller of `build()`/`safeBuild()` that runs its own formatting pass can reuse it. It also double-checks that a cache-hit file still exists in the underlying storage before skipping the write, so a manually deleted or reverted generated file gets recreated instead of staying missing, and it persists its manifest once per build (via the storage `dispose()` hook, now called after every build) instead of on every cache-miss write. `kubb generate --watch` also now serializes rebuilds so overlapping filesystem events can't run two builds concurrently against the same output directory.
