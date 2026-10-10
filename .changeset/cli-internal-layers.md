---
'@kubb/cli': patch
---

Reorganize the CLI internals: config discovery moves to its own module, the logger helpers fold into the loggers that use them, and every command loads its runner the same way. Every command, flag and printed line stays the same.
