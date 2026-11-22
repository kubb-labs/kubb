---
'@kubb/plugin-barrel': patch
---

Barrel banners and footers read the plugin's resolver from the running `kubb:plugins:end` hook, not from a memo kept since `setup`.
