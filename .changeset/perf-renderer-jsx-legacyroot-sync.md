---
"@kubb/renderer-jsx": patch
---

Add `jsxRendererSync`, a React-free recursive renderer 2 to 4× faster than `jsxRenderer`. Add `stream()` for incremental file processing. Node attributes use plain objects instead of `Map`. `jsxRenderer` is unchanged, and all new APIs are additive.
