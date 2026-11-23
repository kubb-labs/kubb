---
'@kubb/kit': patch
---

Render JSX with `jsxRenderer` when a generator sets no `renderer`, so JSX generators no longer need the `renderer` line.

- Keeps an explicit `renderer`, and `renderer: null` still skips rendering.
- Warns when a generator returns something no renderer can write. Before, it wrote nothing without a word.

```diff
 defineGenerator({
   name: 'zod',
-  renderer: jsxRenderer,
   schema(node, ctx) { … },
 })
```
