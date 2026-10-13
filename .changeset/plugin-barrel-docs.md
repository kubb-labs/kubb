---
'@kubb/plugin-barrel': patch
---

The registry description and README now say the root barrel is written only when `output.barrel` is set on `defineConfig`. The README drops `pluginBarrel({ type: 'named' })` and the `'propagate'` type, neither of which exists. `pluginBarrel()` takes no arguments and is configured through `output.barrel`.
