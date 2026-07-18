---
'@kubb/plugin-barrel': patch
---

Build the barrel directory tree once per generation run instead of once per barrelled plugin plus once more for the root.

`kubb:plugin:end` now only records each plugin's barrel target and strategy. `kubb:plugins:end` indexes the full output directory once and derives every plugin barrel and the root barrel from that shared tree, instead of re-scanning the whole file set for each one.
