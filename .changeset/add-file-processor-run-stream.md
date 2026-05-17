---
"@kubb/core": minor
---

Add `FileProcessor.runStream()` and per-plugin incremental file flushing.

## `FileProcessor.runStream()`

New async generator that yields one `ParsedFile` at a time instead of batching all files through `pLimit` + `AsyncEventEmitter`.

`run()` now delegates to `runStream()` internally, removing duplicated parse logic and the `mode: 'sequential' | 'parallel'` option (the concurrency cap has been removed along with the `p-limit` dependency).

```ts
import { FileProcessor, type ParsedFile } from '@kubb/core'

const fp = new FileProcessor()

for await (const { file, source, processed, total } of fp.runStream(files)) {
  console.log(`[${processed}/${total}] ${file.path}`)
  if (source) await storage.setItem(file.path, source)
}
```

New exports:
- `runStream(files, options?)` — async generator on `FileProcessor`
- `ParsedFile` — type yielded by `runStream`: `{ file, source, processed, total, percentage }`

## Per-plugin incremental flushing

`safeBuild()` now flushes files after each plugin rather than once at the end. A path snapshot is taken before each plugin runs; after the plugin completes (including `kubb:plugin:end` handlers), only files whose paths were not in the snapshot are written. Files shared across plugins remain in the queue and are written at the final flush.

For a 4-plugin, 200-files-per-plugin build this means parsed strings from plugin N are eligible for GC before plugin N+1 begins.

## Performance vs the previous `run()` parallel approach (petStore + 4 plugins, `memoryStorage`)

| Metric | before | after | delta |
|---|---|---|---|
| Throughput (ops/s) | 257,431 | 297,416 | **+15.5%** |
| Mean latency (ms) | 0.0039 | 0.0034 | **−13%** |
| First-write latency (ops/s) | 234,442 | 280,272 | **+19.6%** |
| p999 tail latency (ms) | 0.0575 | 0.0374 | **−35%** |

## Removed

- `p-limit` dependency from `@kubb/core` (and its bundled `yocto-queue`)
- `PARALLEL_CONCURRENCY_LIMIT` constant
- `mode: 'sequential' | 'parallel'` option from `FileProcessor.run()`
