---
'@kubb/cli': minor
'@kubb/core': patch
'kubb': minor
---

`kubb generate` runs the entries of a config file that exports several in parallel, on one worker process per CPU core, with the largest local input first. Each entry's output still prints in config order. `--watch` keeps generating them one after another. The output manifest now merges with what is on disk when it saves, so entries that share a root no longer overwrite each other's record.
