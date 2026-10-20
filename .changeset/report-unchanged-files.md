---
'@kubb/core': patch
---

Report more about each run. `kubb:files:processing:end` lists the paths it skipped as `unchanged`, each plugin's `performance` diagnostic carries the number of `files` its generators added, and the `Report` type is exported with new `filesUnchanged` and per-plugin `files` fields. `Diagnostics.format` takes a `position` option, so a host can show a diagnostic's line and column in the spec.
