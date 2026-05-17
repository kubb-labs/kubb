---
"@kubb/core": minor
---

Add `FileProcessor.runStream()` — an async generator that yields one `ParsedFile` at a time.

This is more memory-efficient than `run()` for large builds: one parsed string lives in memory at a time (GC-eligible after each write) instead of up to 16 with the `pLimit`-based parallel path.

`flushPendingFiles()` inside `safeBuild()` now uses `runStream()`, removing ~25 lines of event-listener boilerplate and writing each file immediately after it is parsed.

New exports:
- `runStream(files, options?)` — async generator on `FileProcessor`
- `ParsedFile` — type yielded by `runStream`: `{ file, source, processed, total, percentage }`

Performance improvement vs `run()` parallel (petStore + 4 plugins, `memoryStorage`):
- Throughput: **+15.5%** ops/s
- First-write latency: **+19.6%** ops/s
- p999 tail latency: **−35%** (0.0575 ms → 0.0374 ms)
- Peak-heap overhead: **−11%**

`run()` is unchanged — this is fully backwards-compatible.

```ts
import { FileProcessor, type ParsedFile } from '@kubb/core'

const fp = new FileProcessor()

for await (const { file, source, processed, total } of fp.runStream(files)) {
  console.log(`[${processed}/${total}] ${file.path}`)
  if (source) await storage.setItem(file.path, source)
}
```
