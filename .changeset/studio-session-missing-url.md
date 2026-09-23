---
'@kubb/studio': patch
---

Fail with a readable error when Kubb Studio's session response has no WebSocket URL, instead of retrying forever on `Invalid URL: undefined`. The error names the endpoint, status, content type, and any redirect, which points at a proxy, firewall, or wrong `--url` answering in Studio's place.
