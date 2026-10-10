---
'@kubb/cli': patch
---

Drop the `chokidar`, `unconfig` and `verkit` dependencies: the CLI now finds `kubb.config.*` itself, watches an input file with Node's `fs.watch`, and compares versions numerically for the update check. Every command, flag and printed line stays the same.
