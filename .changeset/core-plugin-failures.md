---
'@kubb/core': patch
---

Report plugin problems that used to pass silently, and keep the previous output when a run fails early.

- Warn with `KUBB_PLUGIN_NOT_FOUND` when a plugin lists a dependency that is not in the config.
- Count a plugin whose `kubb:plugin:setup` throws as a failed plugin in the run summary.
- Empty the output folder for `output.clean` right before the new files are written, so an invalid spec or a failing setup no longer leaves it empty.
