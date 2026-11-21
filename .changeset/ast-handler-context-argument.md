---
'@kubb/ast': patch
---

Pass the handler context to printer handlers and macro callbacks as the second argument too, so `this` and the second argument are the same object. A printer handler or the root `print` override can now be an arrow function, such as `array: (node, ctx) => ctx.transform(node.items[0])`. Macro callbacks get the visitor context as `this`. One-argument handlers keep working.
