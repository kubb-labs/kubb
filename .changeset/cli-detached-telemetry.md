---
'@kubb/cli': patch
---

The CLI now sends its anonymous telemetry from a detached process, so `kubb generate`, `validate`, `mcp`, and `studio` exit as soon as their work is done. Before, the process waited up to a second for the request, about 350–500 ms on a typical connection.
