---
"@kubb/renderer-jsx": patch
---

Add a synchronous recursive renderer 2 to 4× faster than the former async fiber path. Add `stream()` for incremental file processing. Node attributes use plain objects instead of `Map`. The renderer is exported as `jsxRenderer`.
