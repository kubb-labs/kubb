---
'@kubb/ast': minor
'@kubb/kit': minor
---

Printer handlers can pass options to one child: `this.transform(node, options)` and `this.base(node, options)` merge them over `this.options` for that call only, without building a new printer or changing the caller's options. `this.parent` is the schema node whose handler called `this.transform`, and `printer.transform` and `printer.print` take the same optional `options`. Imports declared by nested handlers reach `printer.drainImports()`.
