---
'@kubb/studio': patch
'@kubb/core': patch
---

Keep recent generations by job id and snapshot the output directory before each run, so Studio can diff a run against an earlier one or against the files on disk. Agents with a project keep them in `node_modules/.cache/kubb`, so they survive a restart, and sandboxes keep them in memory. `KUBB_AGENT_MAX_GENERATIONS` (default 8), `KUBB_AGENT_MAX_GENERATIONS_MB` (default 100) and `KUBB_AGENT_MAX_SNAPSHOT_MB` (default 50) set the limits. Breaking for the Studio connection: `readFiles` now takes a `jobId` and a `source`, and `GenerateResult.changes` is replaced by `hashes` and `disk.hashes`. `@kubb/core` now exports `cacheStorage`.
