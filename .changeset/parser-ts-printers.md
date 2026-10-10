---
'@kubb/parser-ts': patch
---

Load TypeScript only on the first `print` or `copy` call, so a run that only parses files starts faster.
