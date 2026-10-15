---
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
---

Type `adapterOas` and `pluginBarrel` with the factory types `@kubb/kit` re-exports, so their published declarations no longer import `@kubb/core`, which neither package depends on. Under pnpm the import did not resolve and both factories became an error type.
