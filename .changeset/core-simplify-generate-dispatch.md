---
'@kubb/core': patch
---

Simplify the generate phase: schema and operation nodes now run through each plugin's generators in a single ordered pass instead of parallel batches.

The generators run synchronously, so the old `Promise.all` batching never overlapped any work. It only marked where queued writes flushed. The pass now walks nodes in order and flushes every `GENERATE_FLUSH_EVERY` nodes (the renamed `SCHEMA_PARALLEL`), keeping the generation/write overlap that speeds up large specs on disk while dropping the `forBatches` helper.
