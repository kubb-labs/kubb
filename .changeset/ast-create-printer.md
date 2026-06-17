---
'@kubb/ast': major
---

Rename `definePrinter` to `createPrinter` and drop the `createPrinterFactory` export.

`createPrinter` is the single helper for building a schema printer. The generic `createPrinterFactory` that sat behind it is now inlined, since the only consumer that keyed a printer by a field other than `node.type` (`@kubb/plugin-ts`'s function printer) no longer needs it. Replace `definePrinter(...)` with `createPrinter(...)`; the builder shape, options, and `Printer` result are unchanged.
