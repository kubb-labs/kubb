---
'@kubb/cli': minor
'@kubb/studio': patch
---

Add `kubb studio start` and `stop` for a background connection per project. `status` reports its connection state and log path, and `logout` stops it before removing credentials. Rejected tokens stop the worker until you log in again.

Use one shared connection loop for the CLI and Docker agent. Abort pending registration on shutdown and wait for canceled generation cleanup before reconnecting.
