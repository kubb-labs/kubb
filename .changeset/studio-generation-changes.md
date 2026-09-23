---
'@kubb/studio': minor
---

Report which files a Studio run added, changed, or removed, and serve the previous run's contents so Studio can show a diff.

- `GenerateResult.changes` maps each path that differs from the session's previous successful run to `added`, `changed`, or `removed`. Unchanged files are left out, and the field is absent on a session's first run.
- `readFiles` takes `revision: 'previous'` to read the run before the latest one, including files the latest run removed. The previous run is read into memory before the next run starts, so a session that writes to disk can still be diffed after its files are overwritten.
- A failed run leaves the last successful run as the one to compare against.
- `FileChange` is exported from `@kubb/studio`.
