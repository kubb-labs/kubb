---
'@kubb/cli': patch
---

Ctrl+C in `kubb studio connect` now disconnects cleanly and prints "Disconnected", instead of the spinner exiting the process with "Canceled". The "Ready for jobs" spinner stops when the session ends, and a Studio warning pauses it instead of leaving a stale line.
