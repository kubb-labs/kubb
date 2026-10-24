---
'@kubb/cli': patch
'@kubb/studio': patch
---

`kubb add` and `kubb init` edit `kubb.config.ts` without `@kubb/studio`. The config editor uses `yuku-parser` instead of `magicast`.

Breaking: `applyConfigEdits` and `writeConfigEdits` are now `editConfig` and `editConfigFile`, and the `set` and `remove` operations are now `set-option` and `remove-option`. The old operation names still work for this release.
