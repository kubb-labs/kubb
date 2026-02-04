---
"@kubb/cli": patch
"@kubb/core": patch
---

Fixed version check to work offline by gracefully handling network errors. Added `isOnline()` and `executeIfOnline()` helpers in `@kubb/core/utils` to detect internet connectivity.
