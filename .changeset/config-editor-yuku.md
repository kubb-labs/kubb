---
'@kubb/cli': patch
'@kubb/studio': patch
---

`kubb add` and `kubb init` now edit `kubb.config.ts` without `@kubb/studio` installed. The config editor parses with `yuku-parser` instead of `magicast`, which drops about 4.5 MB of Babel from the `@kubb/studio` install.

Breaking for Studio clients: `applyConfigEdits` and `writeConfigEdits` are now `editConfig` and `editConfigFile`, and the `set` and `remove` edit operations are now `set-option` and `remove-option`.
