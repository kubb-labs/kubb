---
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
---

Declare `@kubb/core` as a dependency and import `defineExtension` from it. The published types of `adapterOas` and `pluginBarrel` import `@kubb/core`, so they failed to resolve under pnpm and other strict installers.
