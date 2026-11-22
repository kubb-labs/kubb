---
'@kubb/core': patch
---

Run every hook in a plugin's `hooks` map with the plugin's visit context, so composables such as `memo()` work in hooks like `kubb:build:start` and `kubb:plugins:end`.

- `this` and `useKubb()` return that context.
- A hook fired inside another hook keeps the outer hook's context.
