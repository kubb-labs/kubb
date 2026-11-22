---
'@kubb/ast': patch
---

Speed up import merging on large specs by caching each import's relative path, with no change to the generated output.
