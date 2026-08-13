---
'@kubb/core': patch
---

Skip writing a file the storage already holds, for every storage driver instead of only `fsStorage`.

`FileManager` handed every generated file to `storage.writeItem` on each build and left it to the driver to notice the content had not changed. `fsStorage` does that check internally, so builds onto the filesystem already left untouched files alone. A custom storage backed by S3 or a database got a write per file per build regardless of content, and anything watching the far end read every one of them as a change.

The check now runs in the write pipeline, before any driver is called. A rebuild that generates identical output writes nothing, whatever the storage.

`fsStorage` keeps its own check for direct callers. An unchanged file still costs a single read, because the pipeline now does the read the driver used to do.
