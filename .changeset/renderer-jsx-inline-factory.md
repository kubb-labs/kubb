---
"@kubb/renderer-jsx": major
---

Remove `createRenderer` export from `@kubb/renderer-jsx`. Use `jsxRenderer()` directly to obtain a renderer instance instead.

```ts
// Before
import { createRenderer } from '@kubb/renderer-jsx'
const renderer = createRenderer()

// After
import { jsxRenderer } from '@kubb/renderer-jsx'
const renderer = jsxRenderer()
```

`jsxRenderer` is now a plain factory function with no dependency on `@kubb/core`, which resolves the circular package dependency between `@kubb/renderer-jsx` and `@kubb/core`.
