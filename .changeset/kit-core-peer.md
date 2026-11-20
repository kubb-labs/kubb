---
'@kubb/kit': patch
---

Make `@kubb/core` a peer dependency of `@kubb/kit`, with a range starting at `5.23.1`. Kit now runs on the core the user installed and never installs a second copy of its own. A newer kit no longer requires a newer core.
