---
"@kubb/adapter-oas": patch
---

An unquoted `swagger: 2.0` (parsed by YAML as the number `2`) is now upgraded like `swagger: '2.0'`, so its `definitions` are no longer dropped.
