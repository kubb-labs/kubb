---
'@kubb/ast': minor
'@kubb/core': minor
---

Reduce peak memory by leaning on the existing `Storage` abstraction.

`BuildOutput.sources` is replaced by `BuildOutput.storage`, a read-through `Storage` view backed by `config.storage` (defaults to `fsStorage()`). Generated source bytes are no longer duplicated in memory.

`FileProcessor` now exposes a typed `events` property (`AsyncEventEmitter<FileProcessorEvents>`) with `start`, `update`, and `end` events. The previous `onStart`, `onUpdate`, and `onEnd` callback options have been removed.

`Kubb.driver` and `Kubb.config` now throw if accessed before `setup()` instead of returning `undefined`.
