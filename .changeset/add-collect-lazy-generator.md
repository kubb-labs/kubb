---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
---

Export `collectLazy()` from `@kubb/ast`, a generator version of `collect()` that yields results one at a time without materializing an intermediate array.

`getChildren()` and `collectRefs()` are now generators internally. `containsCircularRef()` uses `collectLazy()` with early exit to stop at the first matching circular ref.
