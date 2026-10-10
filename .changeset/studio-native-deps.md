---
'@kubb/studio': patch
---

Use the global `WebSocket` (Node 22 and later) instead of the `ws` package for the agent connection.

- A failed handshake still settles as close code 1006.
