---
'@kubb/plugin-barrel': patch
---

`@kubb/plugin-barrel` no longer keeps the build memo from `setup`. Barrel banners and footers read the plugin's resolver from the memo of the running `kubb:plugins:end` hook.
