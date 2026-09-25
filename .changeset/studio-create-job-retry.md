---
'@kubb/studio': patch
---

`createJob` retries a busy agent, a full queue, or a momentary lack of a live connection (409, 429, 503) with exponential backoff and jitter, honoring Studio's `Retry-After` header when it sends one, up to a new `timeoutMs` option (default 60 seconds). Every other failure, including a missing agent (404), still throws immediately.
