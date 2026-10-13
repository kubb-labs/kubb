---
'@kubb/cli': patch
'kubb': patch
---

The `kubb` bins pass `process.argv.slice(2)` to `run`, whose `argv` parameter now takes the command arguments without the executable and script entries.
