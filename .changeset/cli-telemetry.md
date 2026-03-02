---
'@kubb/cli': minor
---

Add anonymous telemetry to the Kubb CLI to track usage data (command, plugins, version, duration, platform, Node.js version, and file count). No OpenAPI specs, file paths, plugin options, or secrets are ever collected.

Telemetry can be disabled at any time by setting:
- `DO_NOT_TRACK=1` – standard opt-out flag recognised by many developer tools ([consoledonottrack.com](https://consoledonottrack.com))
- `KUBB_DISABLE_TELEMETRY=1` – Kubb-specific opt-out flag
