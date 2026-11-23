---
'@kubb/kit': patch
---

Accept several macros in one `addMacro(...macros)` call, and deprecate `setMacros`. A plugin passes its own `macros` option to `addMacro`.

```diff
 setup(options) {
-  setMacros([...defaultMacros, ...(options.macros ?? [])])
+  addMacro(...defaultMacros, ...(options.macros ?? []))
   return options
 },
```
