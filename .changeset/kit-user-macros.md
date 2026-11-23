---
'@kubb/kit': patch
---

Apply the user's `macros` option in every plugin defined with `defineExtension` from `kubb/kit`, after the plugin's own macros, so a plugin no longer passes it on with `setMacros`.

- Accepts several macros in one `addMacro(...macros)` call.
- Deprecates `setMacros`. A plugin that still passes the user's macros to it gets each one once, after its own macros, matched by name.

```diff
 setup(options) {
-  setMacros([...defaultMacros, ...(options.macros ?? [])])
+  addMacro(...defaultMacros)
   return options
 },
```
