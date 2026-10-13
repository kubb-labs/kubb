---
'@kubb/plugin-barrel': patch
---

A `barrel: false` plugin that writes to the output root (`output.path` of `'.'` or `''`) no longer removes every other plugin's barrel or empties the root barrel. The barrel plugin now excludes only the files that plugin owns, matched by `meta.pluginName`. A `barrel: false` plugin with its own subdirectory behaves as before. A plugin without an `output.path` no longer throws a `TypeError`.
