---
'@kubb/core': patch
---

Fix `resolveOptions` throwing `Invalid value used as weak map key` when a plugin's `options` is falsy but not `null`/`undefined` (for example `false`), such as a plugin re-instantiated by an external merge (Kubb Studio, custom tooling) with an unexpected options value. The memoization cache now only keys by `options` when it's actually an object, falling back to a direct (uncached) resolve otherwise.
