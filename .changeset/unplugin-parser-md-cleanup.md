---
'unplugin-kubb': patch
'@kubb/parser-md': patch
---

Declare `@kubb/core` once in `unplugin-kubb` (as a dependency, no longer also as a peer) and expose `parserMd().print` directly instead of through a wrapper.
