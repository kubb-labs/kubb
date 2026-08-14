---
'@kubb/core': patch
---

Skip writing a file the storage already holds, for every storage driver instead of only `fsStorage`.

`FileManager` handed every generated file to `storage.writeItem` and left it to the driver to notice the content had not changed. `fsStorage` does that check internally, so filesystem builds were already fine, but a custom storage backed by S3 or a database got a write per file per build regardless of content. The check now runs in the write pipeline, before any driver is called, so a rebuild that generates identical output writes nothing whatever the storage.
