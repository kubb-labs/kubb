---
'@kubb/core': patch
'@kubb/kit': patch
---

Add `memo.get(key)`, `memo.set(key, value)` and `memo.has(key)` to the build memo, so a value can be replaced after it was first stored. The setup context gains `plugin`, with the name and meta of the plugin being set up, so `useKubb().plugin.name` works in `setup`.
