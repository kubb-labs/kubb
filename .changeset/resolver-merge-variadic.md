---
"@kubb/core": minor
---

`Resolver.merge` now takes any number of overrides and folds them onto the base left to right, with the last override winning per key. Top-level keys replace and namespaces merge per method, the same as before, so you can layer several partial resolver patches in one call instead of chaining `merge` or spreading each namespace by hand. A two-argument call behaves exactly as it did.
