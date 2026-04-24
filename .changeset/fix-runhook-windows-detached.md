---
'@kubb/cli': patch
---

Fix hook stdout not captured on Windows by only using `detached: true` on non-Windows platforms in `runHook`.
