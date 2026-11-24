---
"@kubb/cli": patch
---

`kubb generate` now adds the diagnostics a run collects to its anonymous telemetry. Each problem sends only its code, severity, plugin, and a count. The message is never sent, so no file paths or schema names leave your machine.
