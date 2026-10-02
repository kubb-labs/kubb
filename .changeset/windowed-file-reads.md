---
'@kubb/studio': minor
---

Add an optional `window` to `readFiles`, so a caller can read a large generated file piece by piece. The reply carries only the requested lines plus the file's `totalLines`, and reads without a `window` behave as before.
