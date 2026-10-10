---
'@kubb/core': patch
---

Keep a failing hook listener's error message to the hook name. The message no longer serializes the hook arguments, which could be a whole config or AST subtree.
