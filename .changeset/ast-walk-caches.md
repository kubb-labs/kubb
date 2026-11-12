---
'@kubb/ast': patch
'@kubb/plugin-barrel': patch
---

Speed up generation on large specs: the AST walk allocates less per node, an enum's literal values are read once per node, and nested barrels compute each file's exports once.
