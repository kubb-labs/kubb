---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
---

Use generator functions for lazy AST traversal.

`collectLazy()` is now exported from `@kubb/ast`. It is a generator version of `collect()` that yields results one by one without materializing an intermediate array. `collect()` is unchanged and still returns `Array<T>`.

`getChildren()` and `collectRefs()` are converted to generators internally, removing per-node temporary array allocations during traversal.

`containsCircularRef()` uses `collectLazy()` with an early-exit loop and stops at the first matching circular ref instead of traversing the full subtree.
