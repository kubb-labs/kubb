---
'@kubb/core': patch
'@kubb/ast': patch
---

Keep each schema's import path and each resolved name for the rest of the build, and look up a `memo` hit with one map read. On the 45 MB Microsoft Graph spec, `kubb generate` uses about 3% less CPU, with the same output.
