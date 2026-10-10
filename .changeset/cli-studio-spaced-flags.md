---
'@kubb/cli': patch
---

`kubb studio` accepts a flag value after a space, such as `kubb studio --open --url http://localhost:3000` or `--config ./kubb.config.ts`, instead of failing with "Command not found".
