---
'@kubb/studio': patch
---

Accept `[::1]` as a loopback host for plaintext snapshot uploads, matching the WebSocket check, so a local Studio reachable over IPv6 works the same as over IPv4.
