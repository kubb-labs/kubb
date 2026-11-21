---
'@kubb/core': patch
---

Run the four visit hooks (`kubb:plugin:visit:start`, `kubb:plugin:visit:schema`, `kubb:plugin:visit:operation` and `kubb:plugin:visit:end`) through `withContext`. `this`, `ctx` and `useKubb()` are now the same plugin visit context there, so composables such as `memo()` work in visit hooks.
