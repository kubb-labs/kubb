---
'@kubb/studio': patch
---

Drop the unused `importName` field of the `add-plugin` config edit, the `file` field of `SaveResult`, the `InstalledExtensions` export of the package root (now in `@kubb/studio/protocol`), and the `@kubb/core` type re-exports from `@kubb/studio/protocol`. Import those types from `@kubb/core`.

A `null` option value from Studio now unsets the value from `kubb.config.ts` for that generate, so the extension's default applies again.
