---
'@kubb/core': patch
---

Run every hook in a plugin's `hooks` map through `withContext`. A hook Kubb fires, such as `kubb:build:start` or `kubb:plugins:end`, gets the plugin's own visit context as `this` and from `useKubb()`, so composables such as `memo()` work there. A hook fired inside another hook keeps that hook's context. The walk reuses the same visit context.
