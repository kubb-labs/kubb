---
'@kubb/studio': patch
---

Let Studio diff a run against an earlier run, or against the files on disk.

This breaks the Studio connection. It replaces the session-wide `GenerateResult.changes` and `readFiles({ revision: 'previous' })` from the last release, which compared against whichever run the session did last, another tenant's included on a pooled sandbox. `readFiles` now takes a `jobId` (required) and a `source`
(`'output'` or `'disk'`), and fails with `GENERATION_GONE_MESSAGE` for a job the agent no longer keeps.
Reads are only ever by job id, so on a pooled sandbox agent one tenant never reaches another's output:
Studio decides whose jobs a reader may see. Update Studio and the agent together.

- `GenerateResult.hashes` fingerprints every file the run produced, so Studio can tell added, changed,
  unchanged and deleted files apart without reading them.
- The agent keeps the last 8 generations (up to 100 MB in memory together). A run written to disk is
  copied into memory before the next run overwrites it.
- An agent with a project on disk (CLI, CI and Docker agents, not sandboxes) snapshots the output
  directory before each run. `GenerateResult.disk.hashes` fingerprints it, and `source: 'disk'` reads it
  back, so Studio can show what a run changes, or would change, in the project. The snapshot is skipped
  when the output directory is the project root or holds more than 10,000 files, and kept as hashes only
  above 50 MB when the run writes over it.
