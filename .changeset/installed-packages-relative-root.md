---
'@kubb/core': patch
---

Fix `readInstalledPackages` throwing when `root` is a relative path, which made CI snapshots fail with `The argument 'filename' must be a file URL object, file URL string, or absolute path string`.
