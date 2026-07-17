---
'@kubb/core': patch
---

Cap file writing to a bounded pool and stream progress in generation order.

`FileManager.write` parsed every file at once, so large specs held every source in memory and the `kubb:files:processing:update` rows arrived in whichever order files finished. It now caps in-flight files at 50, which keeps memory flat on large specs while small specs still write fully in parallel. Each row carries its file's position, so the CLI counter and Kubb Studio's events panel show a stable `1..N` list.
