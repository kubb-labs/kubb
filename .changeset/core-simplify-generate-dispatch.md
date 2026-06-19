---
'@kubb/core': patch
---

Simplify the generate phase: dispatch schema and operation nodes through each plugin's generators in a single ordered pass instead of parallel batches.

The generators run synchronously, so the previous `Promise.all` batching did not actually overlap any work — it only provided the points where queued writes were flushed. The pass now walks nodes in order and flushes every `GENERATE_FLUSH_EVERY` nodes, keeping the generation/write overlap that makes large specs faster on disk while dropping the `forBatches` helper and the `SCHEMA_PARALLEL` concurrency knob (renamed to `GENERATE_FLUSH_EVERY`).
