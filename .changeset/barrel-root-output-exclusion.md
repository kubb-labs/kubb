---
'@kubb/plugin-barrel': patch
---

A `barrel: false` plugin that writes to the output root (`output.path` of `'.'` or `''`) no longer removes every other plugin's barrel or empties the root barrel. The barrel plugin now excludes only the files that plugin owns, matched by `meta.pluginName`. Files without an owner are still excluded by the `barrel: false` plugin's subdirectory, as before. A plugin without an `output.path` no longer throws a `TypeError`.
