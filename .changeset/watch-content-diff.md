---
'@kubb/cli': patch
---

Compare each watch rebuild with the previous one by file content, so `output.clean`, which rewrites every file, no longer reports every file as changed. "slowest" now shows only when a plugin is visibly slower than the next.
