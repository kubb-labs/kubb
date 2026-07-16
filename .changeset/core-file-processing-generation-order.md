---
'@kubb/core': patch
---

Stream file-processing progress events in a stable order.

The `kubb:files:processing:update` rows were ordered by whichever file finished writing first, so the list shuffled between runs. They now follow the order files were generated, numbered `1..N`, which keeps the CLI counter and Kubb Studio's events panel consistent.
