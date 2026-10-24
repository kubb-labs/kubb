---
'@kubb/cli': patch
'@kubb/studio': patch
---

`kubb add` writes parsers into `kubb.config.ts`, and `kubb update <id>` exits with code 1 when the id is not installed.
