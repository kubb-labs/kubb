---
'@kubb/plugin-barrel': major
---

Adjust for `@kubb/core`'s `output.mode` default flipping from `'directory'` to `'file'`.

A plugin that omits `output.mode` now writes a single file, so `plugin-barrel` skips the per-plugin nested barrel for it (there is no directory to barrel) and re-exports that file straight from the root barrel instead. Plugins that set `output.mode: 'directory'` explicitly keep getting a nested barrel as before.

**Breaking change:** projects that relied on the implicit `'directory'` default to get per-plugin barrel files now need `output.mode: 'directory'` set on that plugin to keep them.
