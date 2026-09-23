---
'@kubb/studio': patch
---

Keep recent generations by job id and snapshot the output directory before each run, so Studio can diff a run against an earlier one or against the files on disk. Breaking for the Studio connection: `readFiles` now takes a `jobId` and a `source`, and `GenerateResult.changes` is replaced by `hashes` and `disk.hashes`.
