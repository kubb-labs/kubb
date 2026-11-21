---
'@kubb/ast': patch
---

Pass the handler context to printer handlers and the root `print` override as the second argument too, so `this` and the second argument are the same object. A printer handler or the root `print` override can now be an arrow function, such as `array: (node, ctx) => ctx!.transform(node.items[0])`. The second argument is typed as optional, with `options` typed as `object`, so existing one-argument handler types still compile; read typed options from `this.options`. Macro callbacks also get their visitor context as `this`. One-argument handlers keep working.
