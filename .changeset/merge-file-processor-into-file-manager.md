---
'@kubb/core': major
---

Merge `FileProcessor` into `FileManager`. `FileManager` now owns both the in-memory file store (`add`, `upsert`, `files`) and the `parse`/`write` methods that turn those files into source strings on `storage`. `FileProcessorHooks` is renamed `FileManagerHooks` and lives on `FileManager#hooks` instead of a separate class.

`FileProcessor` is gone. There's one class to reach for instead of two closely coupled ones. `KubbDriver` now calls `fileManager.write(fileManager.files, { storage, parsers, extension })` once, after every plugin (and post-processing like the barrel plugin) has finished generating, instead of flushing in per-node batches during generation. That batching never measurably sped up a build and only added bookkeeping.
