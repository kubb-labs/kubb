---
'@kubb/studio': patch
---

Dedupe internals: a projection table drives the generation event stream, a run's kept output comes from the files the build returned, and the command, parse and literal helpers are shared. No behavior change.
