---
'@kubb/cli': minor
'@kubb/core': minor
---

Add `kubb generate --check`, which exits with 1 when the generated files on disk are out of date, and `--diff`, which also prints what would change.

`--check` generates into a temporary folder, runs `output.format` and `output.lint` there, and compares the result with `output.path` without writing to it. It does not depend on the cache in `node_modules/.cache/kubb`, so it works on a fresh CI checkout. Under `--check`, a failed run exits with 2.

The JSON reporter adds `check`, with `changed` and a `files` array of `{ path, status, linesAdded, linesRemoved }` per out-of-date file. `Kubb.generate()` in `@kubb/core` accepts `processOutput`.
