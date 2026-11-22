---
'@kubb/ast': patch
---

Printer handlers and the root `print` override get their context as the second argument, so they can be arrow functions.

- `this` and the second argument are the same object, such as `array: (node, ctx) => ctx!.transform(node.items[0])`.
- Read typed options from `this.options`. The second argument types `options` as `object`.
- Macro callbacks get their visitor context as `this`.
- One-argument handlers keep working.
