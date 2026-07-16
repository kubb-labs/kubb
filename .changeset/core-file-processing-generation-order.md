---
'@kubb/core': patch
---

Stream `kubb:files:processing:update` rows in generation order with a sequential counter.

The write pass runs files through `Promise.all`, so the buffered update rows landed in I/O-completion order, which varied from run to run and left the streamed file list nondeterministic. The buffer is now sorted into generation order and renumbered, so a consumer (the CLI counter, Kubb Studio's events panel) renders a stable `1..N` sequence over the generated files. The batch is emitted at once after every file is written, so the counter was never live progress and nothing is lost.
