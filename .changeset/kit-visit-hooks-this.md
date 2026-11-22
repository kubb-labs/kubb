---
'@kubb/kit': patch
---

Keep `this` in the visit hooks of a plugin defined with kit's `defineExtension`, so `this`, `ctx` and `useKubb()` are the same context, as in a plugin defined with core.
