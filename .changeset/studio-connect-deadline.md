---
'@kubb/studio': patch
---

The Studio agent now closes a socket when Kubb Studio does not call `connect()` within 30 seconds of the socket opening, and then reconnects. A `connect()` that fails, for example on a config that does not load, also closes the socket once those 30 seconds have passed. Before, a socket that opened but never finished the handshake waited forever.
