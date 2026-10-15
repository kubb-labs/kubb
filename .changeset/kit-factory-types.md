---
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
---

Type `adapterOas` and `pluginBarrel` with the `AdapterFactory` and `PluginFactory` types from `@kubb/kit`. Their published declarations no longer import `@kubb/core`, which these packages don't depend on, so they resolve under pnpm and other strict installers.
