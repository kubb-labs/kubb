---
'@kubb/studio': patch
---

The Studio agent now closes a socket when Kubb Studio does not call `connect()` within 30 seconds, and then reconnects. Before, a socket that opened but never finished the handshake waited forever.
