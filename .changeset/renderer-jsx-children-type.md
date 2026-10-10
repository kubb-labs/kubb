---
'@kubb/renderer-jsx': patch
---

Type JSX children as an array instead of any iterable, which the renderer never walked, so a `Set` or generator passed as children is now a type error instead of silently rendering nothing. The element type also carries its `$$typeof` brand, and the renderer only walks elements the Kubb JSX runtime created.
