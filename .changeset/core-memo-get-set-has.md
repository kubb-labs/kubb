---
'@kubb/core': patch
'@kubb/kit': patch
---

Add `memo.get(key)`, `memo.set(key, value)` and `memo.has(key)`, so a stored value can be read or replaced.

- The setup context gains `plugin`, so `useKubb().plugin.name` works in `setup`.
