---
'@kubb/cli': patch
'kubb': patch
---

Make `kubb generate` about 0.25 s faster on every run. The update check no longer delays the build: the notice prints at the end only when the registry answered in time. The telemetry request runs in the background with a 1 s cap. `kubb generate` no longer loads the code of the other commands, and source maps load only when `KUBB_DEBUG` is set.
