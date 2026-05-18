---
"@kubb/renderer-jsx": patch
---

JSX rendering is now 2–4× faster with `jsxRendererSync`

Two new optimisations in `@kubb/renderer-jsx` cut render time significantly with no changes required to existing generators.

**`jsxRendererSync` — React-free recursive renderer**

A new `jsxRendererSync` factory replaces React's fiber scheduler with a lightweight recursive tree walk. Because all Kubb components are pure functions, the full React work loop is unnecessary overhead. Swap `jsxRenderer` for `jsxRendererSync` in any generator and it just gets faster:

```ts
import { jsxRendererSync } from '@kubb/renderer-jsx'

export const myGenerator = defineGenerator({
  renderer: jsxRendererSync, // was: jsxRenderer
  // ...
})
```

Measured improvement on a 150-file schema: **12.9 ms → 5.6 ms**.

**`jsxRendererSync().stream()` — process files as they are rendered**

For generators that produce many files, the new `stream()` method yields each `FileNode` as soon as it is ready — before the rest of the element tree is processed — so downstream work can start immediately:

```ts
const renderer = jsxRendererSync()
for await (const file of renderer.stream(element)) {
  await writeFile(file) // starts before the next file is rendered
}
```

**Lower memory use**

Node attributes now use plain objects instead of `Map`, eliminating ~300 bytes of V8 overhead per virtual DOM node. The three separate tree walks previously done per file element (sources, exports, imports) are now a single generator pass.

`jsxRenderer` is unchanged — all new APIs are purely additive.
