---
"@kubb/cli": patch
---

`kubb update <id>` now exits with code 1 when it skips a named extension because it needs a newer Kubb or Node.js. Kubb Studio no longer reports such an update as a success.
