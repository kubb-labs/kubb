---
'@kubb/studio': patch
---

Hash generated files the way writing them to disk leaves them, so a run kept in memory reports the same hashes as one with `--allow-write`, the disk snapshot, and CI snapshots.
