---
'@kubb/renderer-jsx': patch
---

Prefix the stray-text error with `[jsx]` instead of `[react]`.

The error raised when raw text sits directly under `<File>` was tagged `[react]`, but this renderer has no React runtime, so the prefix pointed at the wrong thing.
