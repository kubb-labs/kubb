---
'@kubb/cli': patch
---

Make `kubb generate` faster on most runs: it asks npm for a newer version at most once every 24 hours, keeps the answer in `~/.kubb/cache`, and never asks in CI.
