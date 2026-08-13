---
'@kubb/core': patch
---

Skip writing a file the storage already holds, for every storage driver instead of only `fsStorage`.

`FileManager` handed every generated file to `storage.writeItem` on each build and left it to the driver to notice the content had not changed. `fsStorage` does that check internally, so builds onto the filesystem already left untouched files alone, but a custom storage backed by S3, a database, or an in-memory bundler VFS received a write per file per build regardless of content, and anything watching the other end treated each one as a change.

The check now runs in the write pipeline, before the driver is called. A rebuild that generates identical output performs no writes at all, whatever the storage. `fsStorage` keeps its own check as a safety net for direct callers, so the read count for an unchanged file is unchanged: the pipeline reads it instead of the driver.

Barrel files go through this path like any other generated file, so an unchanged `index.ts` is no longer rewritten either.
