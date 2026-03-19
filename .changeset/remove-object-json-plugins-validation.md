---
"@kubb/core": patch
---

Remove deprecated runtime checks for object-style and JSON-style plugins in `getPlugins`.
These formats have not been supported for some time and the guards are no longer needed.
