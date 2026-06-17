---
'@kubb/ast': major
---

Stop exporting `createPrinterFactory` from `@kubb/ast`.

It was the generic factory behind `definePrinter`, kept public so plugins could key a printer by a field other than `node.type`. The last such consumer (`@kubb/plugin-ts`'s function printer) no longer needs it, so the factory is now internal and `definePrinter` stays the supported way to build a schema printer.
