---
'@kubb/parser-ts': patch
---

Resolve a relative import path from the importing file's directory instead of dropping the first `../`, which produced a wrong path when the target sat outside that directory.
