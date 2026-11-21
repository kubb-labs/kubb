---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/kit': patch
---

Add `setPrinter` to `@kubb/kit`. A plugin registers its printer factory in `setup`, and generators get the printer as `ctx.printer`. Kit builds it once per build and once per matching `override`.

Printers from `createPrinter` get `printer.with(extra)`, which returns the printer with `extra` merged over its options without rerunning the builder. The public `printer.print(node)` and `printer.transform(node)` no longer take an options argument: call `printer.with(extra).print(node)` instead. Handlers keep `this.transform(node, extra)`. `PluginType` takes the printer type as a fifth parameter. A factory gets a `PrinterContext` and is typed with `PrinterFactory`. `GeneratorContext` is now `PrinterContext` plus `printer`.
