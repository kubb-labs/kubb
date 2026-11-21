---
'@kubb/kit': patch
---

Keep `this` in the visit hooks of a plugin defined with kit's `defineExtension`. `this`, `ctx` and `useKubb()` are the same plugin visit context there, as they are for a plugin defined with core.
