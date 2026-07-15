---
'@kubb/plugin-barrel': major
---

Adjust for `output.barrel` defaulting to `false` instead of `{ type: 'named' }`. `pluginBarrel` still ships with `kubb` and `unplugin-kubb` by default, but now generates nothing until a barrel is configured on the root config, a plugin, or both.

**Breaking change:** a config that never set `output.barrel` and relied on the implicit `{ type: 'named' }` default now needs it set explicitly to keep generating barrel files.
