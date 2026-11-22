---
'@kubb/core': patch
---

Run the plugin visit hooks with the plugin's visit context, so `this`, `ctx` and `useKubb()` are the same object and composables such as `memo()` work there.
